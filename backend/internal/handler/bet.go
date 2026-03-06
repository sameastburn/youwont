package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/labstack/echo/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"youwont.api/internal/middleware"
	"youwont.api/internal/model"
	"youwont.api/internal/service"
)

type BetHandler struct {
	svc   *service.BetService
	users UserFinder
}

func NewBetHandler(svc *service.BetService, users UserFinder) *BetHandler {
	return &BetHandler{svc: svc, users: users}
}

// ListByGroup handles GET /groups/:id/bets?status=OPEN.
// @Summary      List bets in a group
// @Description  Returns all bets in a group, optionally filtered by status. Requires group membership.
// @Tags         bets
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "Group ID"
// @Param        status query string false "Filter by status" Enums(OPEN, RESOLVED, CANCELED)
// @Success      200 {object} BetListResponse
// @Failure      400 {object} ErrorResponse
// @Failure      403 {object} ErrorResponse
// @Failure      404 {object} ErrorResponse
// @Router       /groups/{id}/bets [get]
func (h *BetHandler) ListByGroup(c *echo.Context) error {
	user := middleware.UserFromContext(c)

	groupID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		return badRequest(c, "invalid group id")
	}

	var status *string
	if s := c.QueryParam("status"); s != "" {
		status = &s
	}

	bets, err := h.svc.ListByGroup(c.Request().Context(), groupID, user.ID, status)
	if err != nil {
		return handleError(c, err)
	}

	// Collect all creator IDs for hydration
	creatorIDs := make([]primitive.ObjectID, len(bets))
	for i, b := range bets {
		creatorIDs[i] = b.CreatorID
	}
	userMap, _ := buildUserMap(c.Request().Context(), h.users, creatorIDs)

	type betSummary struct {
		ID          interface{} `json:"id"`
		GroupID     interface{} `json:"group_id"`
		Title       string      `json:"title"`
		Description string      `json:"description"`
		Creator     UserSummary `json:"creator"`
		Status      string      `json:"status"`
		WinningSide *string     `json:"winning_side"`
		EndDate     interface{} `json:"end_date"`
		WagerCount  int         `json:"wager_count"`
		Pool        interface{} `json:"pool"`
		CreatedAt   interface{} `json:"created_at"`
	}

	summaries := make([]betSummary, len(bets))
	for i, b := range bets {
		var forTotal, againstTotal, forCount, againstCount int
		for _, w := range b.Wagers {
			if w.Side == "FOR" {
				forTotal += w.Amount
				forCount++
			} else {
				againstTotal += w.Amount
				againstCount++
			}
		}
		summaries[i] = betSummary{
			ID:          b.ID,
			GroupID:     b.GroupID,
			Title:       b.Title,
			Description: b.Description,
			Creator:     userMap[b.CreatorID.Hex()],
			Status:      b.Status,
			WinningSide: b.WinningSide,
			EndDate:     b.EndDate,
			WagerCount:  len(b.Wagers),
			Pool: map[string]int{
				"total":         forTotal + againstTotal,
				"for_total":     forTotal,
				"against_total": againstTotal,
				"for_count":     forCount,
				"against_count": againstCount,
			},
			CreatedAt: b.CreatedAt,
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"bets": summaries,
	})
}

// Create handles POST /groups/:id/bets.
// @Summary      Create a bet
// @Description  Create a new bet with an opening wager. Creator cannot be the decider. Points are deducted immediately. Notifies group members.
// @Tags         bets
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "Group ID"
// @Param        body body CreateBetRequest true "Bet details with opening wager"
// @Success      201 {object} model.Bet
// @Failure      400 {object} ErrorResponse
// @Failure      403 {object} ErrorResponse
// @Failure      404 {object} ErrorResponse
// @Router       /groups/{id}/bets [post]
func (h *BetHandler) Create(c *echo.Context) error {
	user := middleware.UserFromContext(c)

	groupID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		return badRequest(c, "invalid group id")
	}

	var body struct {
		Title        string `json:"title"`
		Description  string `json:"description"`
		EndDate      string `json:"end_date"`
		DeciderID    string `json:"decider_id"`
		OpeningWager struct {
			Side   string `json:"side"`
			Amount int    `json:"amount"`
		} `json:"opening_wager"`
	}
	if err := c.Bind(&body); err != nil {
		return badRequest(c, "invalid request body")
	}
	if body.Title == "" {
		return badRequest(c, "title is required")
	}

	endDate, err := time.Parse(time.RFC3339, body.EndDate)
	if err != nil {
		return badRequest(c, "invalid end_date format (use RFC3339)")
	}

	deciderID, err := primitive.ObjectIDFromHex(body.DeciderID)
	if err != nil {
		return badRequest(c, "invalid decider_id")
	}

	if body.OpeningWager.Side != "FOR" && body.OpeningWager.Side != "AGAINST" {
		return badRequest(c, "opening_wager.side must be FOR or AGAINST")
	}

	input := service.CreateBetInput{
		GroupID:     groupID,
		Title:       body.Title,
		Description: body.Description,
		EndDate:     endDate,
		DeciderID:   deciderID,
		WagerSide:   body.OpeningWager.Side,
		WagerAmount: body.OpeningWager.Amount,
	}

	bet, err := h.svc.Create(c.Request().Context(), user, input)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusCreated, hydrateBet(c.Request().Context(), h.users, bet))
}

// Get handles GET /bets/:id.
// @Summary      Get bet detail
// @Description  Returns full bet detail including all wagers. Requires membership in the bet's group.
// @Tags         bets
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "Bet ID"
// @Success      200 {object} model.Bet
// @Failure      400 {object} ErrorResponse
// @Failure      403 {object} ErrorResponse
// @Failure      404 {object} ErrorResponse
// @Router       /bets/{id} [get]
func (h *BetHandler) Get(c *echo.Context) error {
	user := middleware.UserFromContext(c)

	betID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		return badRequest(c, "invalid bet id")
	}

	bet, err := h.svc.Get(c.Request().Context(), betID, user.ID)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusOK, hydrateBet(c.Request().Context(), h.users, bet))
}

// hydrateBet replaces raw IDs with user summary objects.
func hydrateBet(ctx context.Context, uf UserFinder, bet *model.Bet) map[string]interface{} {
	ids := []primitive.ObjectID{bet.CreatorID, bet.DeciderID}
	for _, w := range bet.Wagers {
		ids = append(ids, w.UserID)
	}
	userMap, _ := buildUserMap(ctx, uf, ids)

	type hydratedWager struct {
		ID       string      `json:"id"`
		User     UserSummary `json:"user"`
		Side     string      `json:"side"`
		Amount   int         `json:"amount"`
		PlacedAt string      `json:"placed_at"`
	}
	wagers := make([]hydratedWager, len(bet.Wagers))
	for i, w := range bet.Wagers {
		wagers[i] = hydratedWager{
			ID:       w.ID.Hex(),
			User:     userMap[w.UserID.Hex()],
			Side:     w.Side,
			Amount:   w.Amount,
			PlacedAt: w.PlacedAt.Format("2006-01-02T15:04:05Z07:00"),
		}
	}

	// Compute pool info
	var forTotal, againstTotal, forCount, againstCount int
	for _, w := range bet.Wagers {
		if w.Side == "FOR" {
			forTotal += w.Amount
			forCount++
		} else {
			againstTotal += w.Amount
			againstCount++
		}
	}

	result := map[string]interface{}{
		"id":          bet.ID,
		"group_id":    bet.GroupID,
		"title":       bet.Title,
		"description": bet.Description,
		"creator":     userMap[bet.CreatorID.Hex()],
		"decider":     userMap[bet.DeciderID.Hex()],
		"end_date":    bet.EndDate,
		"status":      bet.Status,
		"winning_side": bet.WinningSide,
		"wagers":      wagers,
		"pool": map[string]int{
			"total":         forTotal + againstTotal,
			"for_total":     forTotal,
			"against_total": againstTotal,
			"for_count":     forCount,
			"against_count": againstCount,
		},
		"resolved_at": bet.ResolvedAt,
		"created_at":  bet.CreatedAt,
	}
	return result
}

// PlaceWager handles POST /bets/:id/wagers.
// @Summary      Place a wager
// @Description  Place a wager on an open bet. One wager per user per bet. Decider cannot wager. Min 10 pts. Points deducted immediately.
// @Tags         bets
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "Bet ID"
// @Param        body body PlaceWagerRequest true "Wager details"
// @Success      201 {object} model.Bet
// @Failure      400 {object} ErrorResponse
// @Failure      403 {object} ErrorResponse
// @Failure      409 {object} ErrorResponse
// @Router       /bets/{id}/wagers [post]
func (h *BetHandler) PlaceWager(c *echo.Context) error {
	user := middleware.UserFromContext(c)

	betID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		return badRequest(c, "invalid bet id")
	}

	var body struct {
		Side   string `json:"side"`
		Amount int    `json:"amount"`
	}
	if err := c.Bind(&body); err != nil {
		return badRequest(c, "invalid request body")
	}
	if body.Side != "FOR" && body.Side != "AGAINST" {
		return badRequest(c, "side must be FOR or AGAINST")
	}

	bet, err := h.svc.PlaceWager(c.Request().Context(), user, betID, body.Side, body.Amount)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusCreated, hydrateBet(c.Request().Context(), h.users, bet))
}

// ChangeDecider handles PUT /bets/:id/decider.
// @Summary      Change bet decider
// @Description  Change the decider on an open bet. Only the bet creator can do this. New decider must not have wagered.
// @Tags         bets
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "Bet ID"
// @Param        body body ChangeDeciderRequest true "New decider"
// @Success      200 {object} model.Bet
// @Failure      400 {object} ErrorResponse
// @Failure      403 {object} ErrorResponse
// @Failure      404 {object} ErrorResponse
// @Router       /bets/{id}/decider [put]
func (h *BetHandler) ChangeDecider(c *echo.Context) error {
	user := middleware.UserFromContext(c)

	betID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		return badRequest(c, "invalid bet id")
	}

	var body struct {
		DeciderID string `json:"decider_id"`
	}
	if err := c.Bind(&body); err != nil {
		return badRequest(c, "invalid request body")
	}

	deciderID, err := primitive.ObjectIDFromHex(body.DeciderID)
	if err != nil {
		return badRequest(c, "invalid decider_id")
	}

	bet, err := h.svc.ChangeDecider(c.Request().Context(), user, betID, deciderID)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusOK, hydrateBet(c.Request().Context(), h.users, bet))
}

// Resolve handles POST /bets/:id/resolve.
// @Summary      Resolve a bet
// @Description  Resolve an open bet by picking the winning side. Only the decider can resolve. Both sides must have wagers. Points are distributed proportionally and notifications are sent to all participants.
// @Tags         bets
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "Bet ID"
// @Param        body body ResolveRequest true "Winning side"
// @Success      200 {object} ResolveResponse
// @Failure      400 {object} ErrorResponse
// @Failure      403 {object} ErrorResponse
// @Failure      404 {object} ErrorResponse
// @Router       /bets/{id}/resolve [post]
func (h *BetHandler) Resolve(c *echo.Context) error {
	user := middleware.UserFromContext(c)

	betID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		return badRequest(c, "invalid bet id")
	}

	var body struct {
		WinningSide string `json:"winning_side"`
	}
	if err := c.Bind(&body); err != nil {
		return badRequest(c, "invalid request body")
	}
	if body.WinningSide != "FOR" && body.WinningSide != "AGAINST" {
		return badRequest(c, "winning_side must be FOR or AGAINST")
	}

	bet, payouts, err := h.svc.Resolve(c.Request().Context(), user, betID, body.WinningSide)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id":           bet.ID,
		"status":       bet.Status,
		"winning_side": bet.WinningSide,
		"resolved_at":  bet.ResolvedAt,
		"payouts":      payouts,
	})
}
