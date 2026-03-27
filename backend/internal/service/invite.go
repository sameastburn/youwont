package service

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"youwont.api/internal/model"
)

type InviteRepository interface {
	Create(ctx context.Context, invite *model.Invite) error
	FindByID(ctx context.Context, id primitive.ObjectID) (*model.Invite, error)
	FindPendingByInvitee(ctx context.Context, inviteeID primitive.ObjectID) ([]model.Invite, error)
	UpdateStatus(ctx context.Context, id primitive.ObjectID, status string) error
}

type InviteService struct {
	invites InviteRepository
	groups  GroupRepository
	notifs  NotificationRepository
	client  *mongo.Client
}

func NewInviteService(invites InviteRepository, groups GroupRepository, notifs NotificationRepository, client *mongo.Client) *InviteService {
	return &InviteService{
		invites: invites,
		groups:  groups,
		notifs:  notifs,
		client:  client,
	}
}

func (s *InviteService) Send(ctx context.Context, user *model.User, groupID, inviteeID primitive.ObjectID) (*model.Invite, error) {
	group, err := s.groups.FindByID(ctx, groupID)
	if err != nil {
		return nil, err
	}
	if group == nil {
		return nil, ErrNotFound
	}
	if !isMember(group, user.ID) {
		return nil, ErrForbidden
	}
	if isMember(group, inviteeID) {
		return nil, ErrAlreadyExists
	}

	now := time.Now()
	invite := &model.Invite{
		ID:            primitive.NewObjectID(),
		GroupID:       groupID,
		GroupName:     group.Name,
		InvitedBy:     user.ID,
		InvitedByName: user.FullName(),
		InviteeID:     inviteeID,
		Status:        "PENDING",
		CreatedAt:     now,
	}

	notif := &model.Notification{
		ID:        primitive.NewObjectID(),
		UserID:    inviteeID,
		Type:      "GROUP_INVITE",
		RefType:   "invite",
		RefID:     invite.ID,
		Message:   fmt.Sprintf("%s invited you to %s", user.FullName(), group.Name),
		Read:      false,
		CreatedAt: now,
	}

	session, err := s.client.StartSession()
	if err != nil {
		return nil, err
	}
	defer session.EndSession(ctx)

	_, err = session.WithTransaction(ctx, func(sc mongo.SessionContext) (interface{}, error) {
		if err := s.invites.Create(sc, invite); err != nil {
			return nil, err
		}
		if err := s.notifs.Create(sc, notif); err != nil {
			return nil, err
		}
		return nil, nil
	})
	if err != nil {
		return nil, err
	}

	return invite, nil
}

func (s *InviteService) ListMine(ctx context.Context, userID primitive.ObjectID) ([]model.Invite, error) {
	return s.invites.FindPendingByInvitee(ctx, userID)
}

func (s *InviteService) Accept(ctx context.Context, user *model.User, inviteID primitive.ObjectID) (*model.Invite, error) {
	invite, err := s.invites.FindByID(ctx, inviteID)
	if err != nil {
		return nil, err
	}
	if invite == nil {
		return nil, ErrNotFound
	}
	if invite.InviteeID != user.ID {
		return nil, ErrForbidden
	}
	if invite.Status != "PENDING" {
		return nil, ErrAlreadyExists
	}

	member := model.Member{
		UserID:   user.ID,
		Role:     "MEMBER",
		JoinedAt: time.Now(),
	}

	notif := &model.Notification{
		ID:        primitive.NewObjectID(),
		UserID:    invite.InvitedBy,
		Type:      "INVITE_ACCEPTED",
		RefType:   "group",
		RefID:     invite.GroupID,
		Message:   fmt.Sprintf("%s accepted your invite to %s", user.FullName(), invite.GroupName),
		Read:      false,
		CreatedAt: time.Now(),
	}

	session, err := s.client.StartSession()
	if err != nil {
		return nil, err
	}
	defer session.EndSession(ctx)

	_, err = session.WithTransaction(ctx, func(sc mongo.SessionContext) (interface{}, error) {
		if err := s.invites.UpdateStatus(sc, inviteID, "ACCEPTED"); err != nil {
			return nil, err
		}
		if err := s.groups.PushMember(sc, invite.GroupID, member); err != nil {
			return nil, err
		}
		if err := s.notifs.Create(sc, notif); err != nil {
			return nil, err
		}
		return nil, nil
	})
	if err != nil {
		return nil, err
	}

	invite.Status = "ACCEPTED"
	return invite, nil
}

func (s *InviteService) Decline(ctx context.Context, user *model.User, inviteID primitive.ObjectID) (*model.Invite, error) {
	invite, err := s.invites.FindByID(ctx, inviteID)
	if err != nil {
		return nil, err
	}
	if invite == nil {
		return nil, ErrNotFound
	}
	if invite.InviteeID != user.ID {
		return nil, ErrForbidden
	}
	if invite.Status != "PENDING" {
		return nil, ErrAlreadyExists
	}

	if err := s.invites.UpdateStatus(ctx, inviteID, "DECLINED"); err != nil {
		return nil, err
	}

	invite.Status = "DECLINED"
	return invite, nil
}
