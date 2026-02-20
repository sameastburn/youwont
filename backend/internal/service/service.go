package service

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
	"youwont.api/internal/domain"
	"youwont.api/internal/dto"
	"youwont.api/internal/repository"
)


func NewService(repo *repository.Repository) *Service {
	return &Service{repo: repo}
}

type Service struct {
	repo *repository.Repository
}

func (service *Service) CreateUser(userDto *dto.UserDto) error {
	user := domain.UserModel{
		ID: primitive.NilObjectID,
		Name: userDto.Name,
		Email: userDto.Email,
	}
	err := service.repo.CreateUser(user)
	return err
}