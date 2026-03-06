package middleware

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v5"
	"youwont.api/internal/model"
)

// UserFinder is the interface the middleware needs to look up users.
// Defined here (consumer-defined) to avoid coupling to the full service.
type UserFinder interface {
	FindBySupabaseID(ctx context.Context, supabaseID string) (*model.User, error)
}

type Auth struct {
	keys       map[string]*ecdsa.PublicKey // kid -> public key
	userFinder UserFinder
}

// jwksResponse represents the JSON Web Key Set response from Supabase.
type jwksResponse struct {
	Keys []jwkKey `json:"keys"`
}

type jwkKey struct {
	Kty string `json:"kty"`
	Crv string `json:"crv"`
	X   string `json:"x"`
	Y   string `json:"y"`
	Kid string `json:"kid"`
	Alg string `json:"alg"`
}

// NewAuth fetches the JWKS from the Supabase issuer URL and builds an Auth instance.
// jwksURL should be like "https://<project>.supabase.co/auth/v1/.well-known/jwks.json".
func NewAuth(jwksURL string, userFinder UserFinder) (*Auth, error) {
	keys, err := fetchJWKS(jwksURL)
	if err != nil {
		return nil, fmt.Errorf("fetch JWKS: %w", err)
	}
	return &Auth{keys: keys, userFinder: userFinder}, nil
}

// Required is the Echo middleware that enforces authentication on protected routes.
func (a *Auth) Required(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c *echo.Context) error {
		tokenStr := extractBearer(c)
		if tokenStr == "" {
			return c.JSON(http.StatusUnauthorized, errResp("UNAUTHORIZED", "missing authorization token"))
		}

		token, err := jwt.Parse(tokenStr, a.keyFunc)
		if err != nil || !token.Valid {
			return c.JSON(http.StatusUnauthorized, errResp("UNAUTHORIZED", "invalid token"))
		}

		sub, err := token.Claims.GetSubject()
		if err != nil || sub == "" {
			return c.JSON(http.StatusUnauthorized, errResp("UNAUTHORIZED", "invalid token claims"))
		}

		user, err := a.userFinder.FindBySupabaseID(c.Request().Context(), sub)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, errResp("INTERNAL", "server error"))
		}
		if user == nil {
			return c.JSON(http.StatusUnauthorized, errResp("UNAUTHORIZED", "user not found"))
		}

		c.Set("user", user)
		return next(c)
	}
}

// ExtractSubFromToken parses the JWT and returns the sub claim.
// Used by POST /users which needs the supabase_id but no existing MongoDB user.
func (a *Auth) ExtractSubFromToken(c *echo.Context) (string, error) {
	tokenStr := extractBearer(c)
	if tokenStr == "" {
		return "", jwt.ErrTokenMalformed
	}

	token, err := jwt.Parse(tokenStr, a.keyFunc)
	if err != nil || !token.Valid {
		return "", err
	}

	return token.Claims.GetSubject()
}

// keyFunc selects the correct ECDSA public key based on the token's kid header.
func (a *Auth) keyFunc(t *jwt.Token) (interface{}, error) {
	if _, ok := t.Method.(*jwt.SigningMethodECDSA); !ok {
		return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
	}

	kid, ok := t.Header["kid"].(string)
	if !ok {
		return nil, fmt.Errorf("missing kid header")
	}

	key, exists := a.keys[kid]
	if !exists {
		return nil, fmt.Errorf("unknown kid: %s", kid)
	}

	return key, nil
}

// UserFromContext retrieves the authenticated user from the Echo context.
func UserFromContext(c *echo.Context) *model.User {
	u, _ := c.Get("user").(*model.User)
	return u
}

func extractBearer(c *echo.Context) string {
	auth := c.Request().Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return auth[7:]
	}
	return ""
}

func errResp(code, message string) map[string]interface{} {
	return map[string]interface{}{
		"error": map[string]string{
			"code":    code,
			"message": message,
		},
	}
}

// fetchJWKS fetches the JWKS from the given URL and parses EC public keys.
func fetchJWKS(url string) (map[string]*ecdsa.PublicKey, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var jwks jwksResponse
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return nil, err
	}

	keys := make(map[string]*ecdsa.PublicKey)
	for _, k := range jwks.Keys {
		if k.Kty != "EC" || k.Crv != "P-256" {
			continue
		}
		xBytes, err := base64.RawURLEncoding.DecodeString(k.X)
		if err != nil {
			return nil, fmt.Errorf("decode x: %w", err)
		}
		yBytes, err := base64.RawURLEncoding.DecodeString(k.Y)
		if err != nil {
			return nil, fmt.Errorf("decode y: %w", err)
		}
		keys[k.Kid] = &ecdsa.PublicKey{
			Curve: elliptic.P256(),
			X:     new(big.Int).SetBytes(xBytes),
			Y:     new(big.Int).SetBytes(yBytes),
		}
	}

	if len(keys) == 0 {
		return nil, fmt.Errorf("no usable EC keys found in JWKS")
	}

	return keys, nil
}
