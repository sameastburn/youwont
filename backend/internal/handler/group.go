package handler

import (
	"net/http"

	"github.com/labstack/echo/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"youwont.api/internal/middleware"
	"youwont.api/internal/service"
)

type GroupHandler struct {
	svc   *service.GroupService
	users UserFinder
}

func NewGroupHandler(svc *service.GroupService, users UserFinder) *GroupHandler {
	return &GroupHandler{svc: svc, users: users}
}

// Create handles POST /groups.
// @Summary      Create a group
// @Description  Creates a new group with the authenticated user as ADMIN. Auto-generates an invite code.
// @Tags         groups
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body CreateGroupRequest true "Group details"
// @Success      201 {object} model.Group
// @Failure      400 {object} ErrorResponse
// @Failure      401 {object} ErrorResponse
// @Router       /groups [post]
func (h *GroupHandler) Create(c *echo.Context) error {
	user := middleware.UserFromContext(c)

	var body struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := c.Bind(&body); err != nil {
		return badRequest(c, "invalid request body")
	}
	if body.Name == "" {
		return badRequest(c, "name is required")
	}

	group, err := h.svc.Create(c.Request().Context(), user, body.Name, body.Description)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusCreated, group)
}

// List handles GET /groups.
// @Summary      List my groups
// @Description  Returns all groups the authenticated user is a member of.
// @Tags         groups
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} GroupListResponse
// @Failure      401 {object} ErrorResponse
// @Router       /groups [get]
func (h *GroupHandler) List(c *echo.Context) error {
	user := middleware.UserFromContext(c)

	groups, err := h.svc.List(c.Request().Context(), user.ID)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"groups": groups,
	})
}

// Get handles GET /groups/:id.
// @Summary      Get group detail
// @Description  Returns group info including members. Requires group membership.
// @Tags         groups
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "Group ID"
// @Success      200 {object} model.Group
// @Failure      400 {object} ErrorResponse
// @Failure      403 {object} ErrorResponse
// @Failure      404 {object} ErrorResponse
// @Router       /groups/{id} [get]
func (h *GroupHandler) Get(c *echo.Context) error {
	user := middleware.UserFromContext(c)

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		return badRequest(c, "invalid group id")
	}

	group, err := h.svc.Get(c.Request().Context(), id, user.ID)
	if err != nil {
		return handleError(c, err)
	}

	// Hydrate member user info
	memberIDs := make([]primitive.ObjectID, len(group.Members))
	for i, m := range group.Members {
		memberIDs[i] = m.UserID
	}
	userMap, err := buildUserMap(c.Request().Context(), h.users, memberIDs)
	if err != nil {
		return handleError(c, err)
	}

	type hydratedMember struct {
		UserID    string  `json:"user_id"`
		Name      string  `json:"name"`
		Username  string  `json:"username"`
		AvatarURL *string `json:"avatar_url"`
		Role      string  `json:"role"`
		JoinedAt  string  `json:"joined_at"`
	}
	members := make([]hydratedMember, len(group.Members))
	for i, m := range group.Members {
		u := userMap[m.UserID.Hex()]
		members[i] = hydratedMember{
			UserID:    m.UserID.Hex(),
			Name:      u.Name,
			Username:  u.Username,
			AvatarURL: u.AvatarURL,
			Role:      m.Role,
			JoinedAt:  m.JoinedAt.Format("2006-01-02T15:04:05Z07:00"),
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id":          group.ID,
		"name":        group.Name,
		"description": group.Description,
		"invite_code": group.InviteCode,
		"created_by":  group.CreatedBy,
		"members":     members,
		"created_at":  group.CreatedAt,
	})
}

// JoinByCode handles POST /groups/join.
// @Summary      Join group via invite code
// @Description  Join a group using its invite code. Fallback for when in-app invites aren't used.
// @Tags         groups
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body JoinByCodeRequest true "Invite code"
// @Success      200 {object} model.Group
// @Failure      400 {object} ErrorResponse
// @Failure      404 {object} ErrorResponse
// @Failure      409 {object} ErrorResponse
// @Router       /groups/join [post]
func (h *GroupHandler) JoinByCode(c *echo.Context) error {
	user := middleware.UserFromContext(c)

	var body struct {
		InviteCode string `json:"invite_code"`
	}
	if err := c.Bind(&body); err != nil {
		return badRequest(c, "invalid request body")
	}
	if body.InviteCode == "" {
		return badRequest(c, "invite_code is required")
	}

	group, err := h.svc.JoinByCode(c.Request().Context(), user, body.InviteCode)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusOK, group)
}
