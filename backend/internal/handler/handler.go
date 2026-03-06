package handler

import (
	"github.com/labstack/echo/v5"
	"youwont.api/internal/dto"
	"youwont.api/internal/service"
)

func NewHandler(service *service.Service) *Handler {
	return &Handler{service: service}
}

type Handler struct {
	service *service.Service
}

func (handler *Handler) CreateUser(c *echo.Context) error {
	u := new(dto.UserDto)
	if err := c.Bind(u); err != nil {
		return c.JSON(400, map[string]string{"error": "Bad request"})
	}

	if u.Record != nil {
		u.ID = u.Record.ID
		u.Email = u.Record.Email
	} else if u.User != nil {
		u.ID = u.User.ID
		u.Email = u.User.Email
	}

	if err := handler.service.CreateUser(u); err != nil {
		return c.JSON(500, map[string]string{"error": err.Error()})
	}

	return c.JSON(200, map[string]interface{}{})
}
