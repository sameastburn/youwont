package handler

import (
	"io"
	"log"
	"net/http"

	"github.com/labstack/echo/v5"
	"youwont.api/internal/middleware"
	"youwont.api/internal/service"
)

type UserHandler struct {
	svc  *service.UserService
	auth *middleware.Auth
}

func NewUserHandler(svc *service.UserService, auth *middleware.Auth) *UserHandler {
	return &UserHandler{svc: svc, auth: auth}
}

// Create handles POST /users — public endpoint, called after Supabase signup.
// @Summary      Create user profile
// @Description  Called once after Supabase signup to create the user profile in MongoDB. Also supports Supabase webhook format.
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        body body CreateUserRequest true "User details"
// @Success      201 {object} model.User
// @Failure      400 {object} ErrorResponse
// @Failure      401 {object} ErrorResponse
// @Failure      409 {object} ErrorResponse
// @Router       /users [post]
func (h *UserHandler) Create(c *echo.Context) error {
	bodyBytes, _ := io.ReadAll(c.Request().Body)
	log.Printf("POST /users raw body: %s", string(bodyBytes))

	return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
}

// Me handles GET /users/me.
// @Summary      Get current user
// @Description  Returns the authenticated user's profile and point balance.
// @Tags         users
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} model.User
// @Failure      401 {object} ErrorResponse
// @Router       /users/me [get]
func (h *UserHandler) Me(c *echo.Context) error {
	user := middleware.UserFromContext(c)
	return c.JSON(http.StatusOK, user)
}

// Search handles GET /users/search?q=.
// @Summary      Search users by username
// @Description  Search for users by username prefix. Returns max 20 results. Does not include point balances.
// @Tags         users
// @Produce      json
// @Security     BearerAuth
// @Param        q query string true "Username prefix to search for"
// @Success      200 {object} UserSearchResponse
// @Failure      401 {object} ErrorResponse
// @Router       /users/search [get]
func (h *UserHandler) Search(c *echo.Context) error {
	q := c.QueryParam("q")
	users, err := h.svc.Search(c.Request().Context(), q)
	if err != nil {
		return handleError(c, err)
	}

	type searchResult struct {
		ID        string  `json:"id"`
		Name      string  `json:"name"`
		Username  string  `json:"username"`
		AvatarURL *string `json:"avatar_url"`
	}
	results := make([]searchResult, len(users))
	for i, u := range users {
		results[i] = searchResult{
			ID:        u.ID.Hex(),
			Name:      u.Name,
			Username:  u.Username,
			AvatarURL: u.AvatarURL,
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"users": results,
	})
}
