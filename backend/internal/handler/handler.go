package handler

import (
	//"net/http"

	"github.com/labstack/echo/v5"
	"youwont.api/internal/dto"
	"youwont.api/internal/service"
	//"github.com/labstack/echo/v5/middleware"
)

func NewHandler(service *service.Service) *Handler {
	return &Handler{service: service}
}

type Handler struct {
	service *service.Service
}

func (handler *Handler) CreateUser(c *echo.Context) error {
	u := new(dto.UserDto)
    if err := c.Bind(u); err == nil {
		if err := handler.service.CreateUser(u); err == nil {
			return c.JSON(201, "User Created")   
		}
    	return c.JSON(500, err)   
    }
	return c.String(400, "Bad request")
}