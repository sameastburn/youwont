package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"regexp"
	"strings"

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

// supabaseWebhookPayload matches the Supabase before-user-created hook shape.
type supabaseWebhookPayload struct {
	User struct {
		ID           string                 `json:"id"`
		Email        string                 `json:"email"`
		UserMetadata map[string]interface{} `json:"user_metadata"`
	} `json:"user"`
}

// Create handles POST /users — Supabase before-user-created webhook.
// @Summary      Create user profile
// @Description  Called by Supabase before-user-created webhook. Extracts first/last name from user_metadata and creates MongoDB user.
// @Tags         users
// @Accept       json
// @Produce      json
// @Success      200 {object} map[string]string
// @Router       /users [post]
func (h *UserHandler) Create(c *echo.Context) error {
	bodyBytes, _ := io.ReadAll(c.Request().Body)
	log.Printf("POST w/ full /users raw body: %s", string(bodyBytes))

	var payload supabaseWebhookPayload
	if err := json.Unmarshal(bodyBytes, &payload); err != nil {
		log.Printf("POST /users: failed to parse body: %v", err)
		return c.JSON(http.StatusOK, map[string]string{"decision": "reject", "message": "invalid request body"})
	}

	supabaseID := payload.User.ID
	if supabaseID == "" {
		return c.JSON(http.StatusOK, map[string]string{"decision": "reject", "message": "missing user id"})
	}

	firstName, _ := payload.User.UserMetadata["first_name"].(string)
	lastName, _ := payload.User.UserMetadata["last_name"].(string)
	firstName = strings.TrimSpace(firstName)
	lastName = strings.TrimSpace(lastName)

	if firstName == "" {
		return c.JSON(http.StatusOK, map[string]string{"decision": "reject", "message": "first name is required"})
	}

	username := usernameFromEmail(payload.User.Email)

	_, err := h.svc.Create(c.Request().Context(), supabaseID, firstName, lastName, username)
	if err == service.ErrAlreadyExists {
		// Idempotent — user already created, let Supabase proceed
		return c.JSON(http.StatusOK, map[string]string{"decision": "continue"})
	}
	if err != nil {
		log.Printf("POST /users: create failed: %v", err)
		return c.JSON(http.StatusOK, map[string]string{"decision": "reject", "message": "failed to create user"})
	}

	return c.JSON(http.StatusOK, map[string]string{"decision": "continue"})
}

var nonAlphanumeric = regexp.MustCompile(`[^a-z0-9]`)

// usernameFromEmail generates a username from the email prefix with a random suffix.
func usernameFromEmail(email string) string {
	prefix := email
	if at := strings.Index(email, "@"); at > 0 {
		prefix = email[:at]
	}
	prefix = strings.ToLower(prefix)
	prefix = nonAlphanumeric.ReplaceAllString(prefix, "")
	if len(prefix) > 16 {
		prefix = prefix[:16]
	}
	if prefix == "" {
		prefix = "user"
	}
	return fmt.Sprintf("%s%04d", prefix, rand.Intn(10000))
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
		FirstName string  `json:"first_name"`
		LastName  string  `json:"last_name"`
		Username  string  `json:"username"`
		AvatarURL *string `json:"avatar_url"`
	}
	results := make([]searchResult, len(users))
	for i, u := range users {
		results[i] = searchResult{
			ID:        u.ID.Hex(),
			FirstName: u.FirstName,
			LastName:  u.LastName,
			Username:  u.Username,
			AvatarURL: u.AvatarURL,
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"users": results,
	})
}
