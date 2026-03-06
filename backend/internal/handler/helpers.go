package handler

import (
	"context"
	"errors"
	"net/http"

	"github.com/labstack/echo/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"youwont.api/internal/model"
	"youwont.api/internal/service"
)

// UserFinder lets handlers look up users by ID for response hydration.
type UserFinder interface {
	FindByIDs(ctx context.Context, ids []primitive.ObjectID) ([]model.User, error)
}

// UserSummary is the public user info included in hydrated responses.
type UserSummary struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Username  string  `json:"username"`
	AvatarURL *string `json:"avatar_url"`
}

// buildUserMap fetches users by IDs and returns a map from hex ID to UserSummary.
func buildUserMap(ctx context.Context, uf UserFinder, ids []primitive.ObjectID) (map[string]UserSummary, error) {
	if len(ids) == 0 {
		return map[string]UserSummary{}, nil
	}
	// deduplicate
	seen := make(map[primitive.ObjectID]bool)
	unique := make([]primitive.ObjectID, 0, len(ids))
	for _, id := range ids {
		if !seen[id] {
			seen[id] = true
			unique = append(unique, id)
		}
	}
	users, err := uf.FindByIDs(ctx, unique)
	if err != nil {
		return nil, err
	}
	m := make(map[string]UserSummary, len(users))
	for _, u := range users {
		m[u.ID.Hex()] = UserSummary{
			ID:        u.ID.Hex(),
			Name:      u.Name,
			Username:  u.Username,
			AvatarURL: u.AvatarURL,
		}
	}
	return m, nil
}

func handleError(c *echo.Context, err error) error {
	code := http.StatusInternalServerError
	errCode := "INTERNAL"

	switch {
	case errors.Is(err, service.ErrNotFound):
		code = http.StatusNotFound
		errCode = "NOT_FOUND"
	case errors.Is(err, service.ErrForbidden):
		code = http.StatusForbidden
		errCode = "FORBIDDEN"
	case errors.Is(err, service.ErrAlreadyExists):
		code = http.StatusConflict
		errCode = "ALREADY_EXISTS"
	case errors.Is(err, service.ErrInsufficientPoints):
		code = http.StatusBadRequest
		errCode = "INSUFFICIENT_POINTS"
	case errors.Is(err, service.ErrBetNotOpen):
		code = http.StatusBadRequest
		errCode = "BET_NOT_OPEN"
	case errors.Is(err, service.ErrAlreadyWagered):
		code = http.StatusConflict
		errCode = "ALREADY_WAGERED"
	case errors.Is(err, service.ErrDeciderCannotWager):
		code = http.StatusForbidden
		errCode = "DECIDER_CANNOT_WAGER"
	case errors.Is(err, service.ErrCannotSelfDecide):
		code = http.StatusBadRequest
		errCode = "CANNOT_SELF_DECIDE"
	case errors.Is(err, service.ErrNoOpposingSide):
		code = http.StatusBadRequest
		errCode = "NO_OPPOSING_SIDE"
	}

	return c.JSON(code, map[string]interface{}{
		"error": map[string]string{
			"code":    errCode,
			"message": err.Error(),
		},
	})
}

func badRequest(c *echo.Context, message string) error {
	return c.JSON(http.StatusBadRequest, map[string]interface{}{
		"error": map[string]string{
			"code":    "BAD_REQUEST",
			"message": message,
		},
	})
}
