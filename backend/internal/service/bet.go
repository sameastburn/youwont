package service

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"youwont.api/internal/model"
)

type BetRepository interface {
	Create(ctx context.Context, bet *model.Bet) error
	FindByID(ctx context.Context, id primitive.ObjectID) (*model.Bet, error)
	FindByGroupID(ctx context.Context, groupID primitive.ObjectID, status *string) ([]model.Bet, error)
	CountByGroupID(ctx context.Context, groupID primitive.ObjectID, status *string) (int64, error)
	HasOpenBetsByUser(ctx context.Context, groupID, userID primitive.ObjectID) (bool, error)
	PushWager(ctx context.Context, betID primitive.ObjectID, wager model.Wager) error
	Resolve(ctx context.Context, betID primitive.ObjectID, winningSide string, resolvedAt time.Time) error
	UpdateDecider(ctx context.Context, betID, deciderID primitive.ObjectID) error
}

type BetService struct {
	bets     BetRepository
	users    UserRepository
	groups   GroupRepository
	notifs   NotificationRepository
	client   *mongo.Client
	minWager int
}

func NewBetService(
	bets BetRepository,
	users UserRepository,
	groups GroupRepository,
	notifs NotificationRepository,
	client *mongo.Client,
	minWager int,
) *BetService {
	return &BetService{
		bets:     bets,
		users:    users,
		groups:   groups,
		notifs:   notifs,
		client:   client,
		minWager: minWager,
	}
}

func (s *BetService) ListByGroup(ctx context.Context, groupID, userID primitive.ObjectID, status *string) ([]model.Bet, error) {
	group, err := s.groups.FindByID(ctx, groupID)
	if err != nil {
		return nil, err
	}
	if group == nil {
		return nil, ErrNotFound
	}
	if !isMember(group, userID) {
		return nil, ErrForbidden
	}
	return s.bets.FindByGroupID(ctx, groupID, status)
}

func (s *BetService) Get(ctx context.Context, betID, userID primitive.ObjectID) (*model.Bet, error) {
	bet, err := s.bets.FindByID(ctx, betID)
	if err != nil {
		return nil, err
	}
	if bet == nil {
		return nil, ErrNotFound
	}

	group, err := s.groups.FindByID(ctx, bet.GroupID)
	if err != nil {
		return nil, err
	}
	if group == nil || !isMember(group, userID) {
		return nil, ErrForbidden
	}
	return bet, nil
}

type CreateBetInput struct {
	GroupID     primitive.ObjectID
	Title       string
	Description string
	EndDate     time.Time
	DeciderID   primitive.ObjectID
	WagerSide   string
	WagerAmount int
}

func (s *BetService) Create(ctx context.Context, user *model.User, input CreateBetInput) (*model.Bet, error) {
	group, err := s.groups.FindByID(ctx, input.GroupID)
	if err != nil {
		return nil, err
	}
	if group == nil {
		return nil, ErrNotFound
	}
	if !isMember(group, user.ID) {
		return nil, ErrForbidden
	}
	if user.ID == input.DeciderID {
		return nil, ErrCannotSelfDecide
	}
	if !isMember(group, input.DeciderID) {
		return nil, ErrNotFound
	}
	if input.WagerAmount < s.minWager {
		return nil, ErrInsufficientPoints
	}
	if user.Points < input.WagerAmount {
		return nil, ErrInsufficientPoints
	}

	now := time.Now()
	bet := &model.Bet{
		ID:          primitive.NewObjectID(),
		GroupID:     input.GroupID,
		Title:       input.Title,
		Description: input.Description,
		CreatorID:   user.ID,
		DeciderID:   input.DeciderID,
		EndDate:     input.EndDate,
		Status:      "OPEN",
		Wagers: []model.Wager{
			{
				ID:       primitive.NewObjectID(),
				UserID:   user.ID,
				Side:     input.WagerSide,
				Amount:   input.WagerAmount,
				PlacedAt: now,
			},
		},
		CreatedAt: now,
	}

	session, err := s.client.StartSession()
	if err != nil {
		return nil, err
	}
	defer session.EndSession(ctx)

	_, err = session.WithTransaction(ctx, func(sc mongo.SessionContext) (interface{}, error) {
		if err := s.bets.Create(sc, bet); err != nil {
			return nil, err
		}
		if err := s.users.DeductPoints(sc, user.ID, input.WagerAmount); err != nil {
			return nil, err
		}

		var notifs []model.Notification
		for _, m := range group.Members {
			if m.UserID == user.ID {
				continue
			}
			notifs = append(notifs, model.Notification{
				ID:        primitive.NewObjectID(),
				UserID:    m.UserID,
				Type:      "BET_CREATED",
				RefType:   "bet",
				RefID:     bet.ID,
				Message:   fmt.Sprintf("%s created a new bet: \"%s\"", user.FullName(), bet.Title),
				Read:      false,
				CreatedAt: now,
			})
		}
		if len(notifs) > 0 {
			if err := s.notifs.CreateMany(sc, notifs); err != nil {
				return nil, err
			}
		}
		return nil, nil
	})
	if err != nil {
		return nil, err
	}

	return bet, nil
}

func (s *BetService) PlaceWager(ctx context.Context, user *model.User, betID primitive.ObjectID, side string, amount int) (*model.Bet, error) {
	bet, err := s.bets.FindByID(ctx, betID)
	if err != nil {
		return nil, err
	}
	if bet == nil {
		return nil, ErrNotFound
	}
	if bet.Status != "OPEN" {
		return nil, ErrBetNotOpen
	}

	group, err := s.groups.FindByID(ctx, bet.GroupID)
	if err != nil {
		return nil, err
	}
	if group == nil || !isMember(group, user.ID) {
		return nil, ErrForbidden
	}
	if user.ID == bet.DeciderID {
		return nil, ErrDeciderCannotWager
	}
	for _, w := range bet.Wagers {
		if w.UserID == user.ID {
			return nil, ErrAlreadyWagered
		}
	}
	if amount < s.minWager {
		return nil, ErrInsufficientPoints
	}
	if user.Points < amount {
		return nil, ErrInsufficientPoints
	}

	wager := model.Wager{
		ID:       primitive.NewObjectID(),
		UserID:   user.ID,
		Side:     side,
		Amount:   amount,
		PlacedAt: time.Now(),
	}

	session, err := s.client.StartSession()
	if err != nil {
		return nil, err
	}
	defer session.EndSession(ctx)

	_, err = session.WithTransaction(ctx, func(sc mongo.SessionContext) (interface{}, error) {
		if err := s.bets.PushWager(sc, betID, wager); err != nil {
			return nil, err
		}
		if err := s.users.DeductPoints(sc, user.ID, amount); err != nil {
			return nil, err
		}
		return nil, nil
	})
	if err != nil {
		return nil, err
	}

	bet.Wagers = append(bet.Wagers, wager)
	return bet, nil
}

func (s *BetService) ChangeDecider(ctx context.Context, user *model.User, betID, newDeciderID primitive.ObjectID) (*model.Bet, error) {
	bet, err := s.bets.FindByID(ctx, betID)
	if err != nil {
		return nil, err
	}
	if bet == nil {
		return nil, ErrNotFound
	}
	if bet.CreatorID != user.ID {
		return nil, ErrForbidden
	}
	if bet.Status != "OPEN" {
		return nil, ErrBetNotOpen
	}
	if newDeciderID == bet.CreatorID {
		return nil, ErrCannotSelfDecide
	}
	for _, w := range bet.Wagers {
		if w.UserID == newDeciderID {
			return nil, ErrAlreadyWagered
		}
	}

	if err := s.bets.UpdateDecider(ctx, betID, newDeciderID); err != nil {
		return nil, err
	}

	bet.DeciderID = newDeciderID
	return bet, nil
}

type Payout struct {
	UserID primitive.ObjectID `json:"user_id"`
	Name   string             `json:"name"`
	Amount int                `json:"amount"`
	Net    int                `json:"net"`
}

func (s *BetService) Resolve(ctx context.Context, user *model.User, betID primitive.ObjectID, winningSide string) (*model.Bet, []Payout, error) {
	bet, err := s.bets.FindByID(ctx, betID)
	if err != nil {
		return nil, nil, err
	}
	if bet == nil {
		return nil, nil, ErrNotFound
	}
	if bet.DeciderID != user.ID {
		return nil, nil, ErrForbidden
	}
	if bet.Status != "OPEN" {
		return nil, nil, ErrBetNotOpen
	}

	var winners, losers []model.Wager
	for _, w := range bet.Wagers {
		if w.Side == winningSide {
			winners = append(winners, w)
		} else {
			losers = append(losers, w)
		}
	}
	if len(winners) == 0 || len(losers) == 0 {
		return nil, nil, ErrNoOpposingSide
	}

	losingPool := 0
	for _, l := range losers {
		losingPool += l.Amount
	}
	winningPool := 0
	for _, w := range winners {
		winningPool += w.Amount
	}

	// Look up winner names for payout response
	winnerIDs := make([]primitive.ObjectID, len(winners))
	for i, w := range winners {
		winnerIDs[i] = w.UserID
	}
	winnerUsers, err := s.users.FindByIDs(ctx, winnerIDs)
	if err != nil {
		return nil, nil, err
	}
	userMap := make(map[primitive.ObjectID]model.User)
	for _, u := range winnerUsers {
		userMap[u.ID] = u
	}

	resolvedAt := time.Now()
	var payouts []Payout

	session, err := s.client.StartSession()
	if err != nil {
		return nil, nil, err
	}
	defer session.EndSession(ctx)

	_, err = session.WithTransaction(ctx, func(sc mongo.SessionContext) (interface{}, error) {
		if err := s.bets.Resolve(sc, betID, winningSide, resolvedAt); err != nil {
			return nil, err
		}

		now := time.Now()
		var notifs []model.Notification

		for _, w := range winners {
			share := (w.Amount * losingPool) / winningPool
			totalPayout := w.Amount + share

			if err := s.users.AddPoints(sc, w.UserID, totalPayout); err != nil {
				return nil, err
			}

			u := userMap[w.UserID]
			payouts = append(payouts, Payout{
				UserID: w.UserID,
				Name:   u.FullName(),
				Amount: totalPayout,
				Net:    share,
			})

			notifs = append(notifs, model.Notification{
				ID:        primitive.NewObjectID(),
				UserID:    w.UserID,
				Type:      "BET_WON",
				RefType:   "bet",
				RefID:     betID,
				Message:   fmt.Sprintf("You won %d pts on \"%s\"!", totalPayout, bet.Title),
				Read:      false,
				CreatedAt: now,
			})
		}

		for _, l := range losers {
			notifs = append(notifs, model.Notification{
				ID:        primitive.NewObjectID(),
				UserID:    l.UserID,
				Type:      "BET_LOST",
				RefType:   "bet",
				RefID:     betID,
				Message:   fmt.Sprintf("You lost %d pts on \"%s\"", l.Amount, bet.Title),
				Read:      false,
				CreatedAt: now,
			})
		}

		if len(notifs) > 0 {
			if err := s.notifs.CreateMany(sc, notifs); err != nil {
				return nil, err
			}
		}

		return nil, nil
	})
	if err != nil {
		return nil, nil, err
	}

	bet.Status = "RESOLVED"
	bet.WinningSide = &winningSide
	bet.ResolvedAt = &resolvedAt
	return bet, payouts, nil
}
