package handler

// Swagger request/response types for documentation only.
// These are not used in handler logic — they exist so swag can generate accurate specs.

// --- Requests ---

type CreateUserRequest struct {
	FirstName string `json:"first_name" example:"John"`
	LastName  string `json:"last_name" example:"Doe"`
}

type CreateGroupRequest struct {
	Name        string `json:"name" example:"The Squad"`
	Description string `json:"description" example:"Our main friend group."`
}

type JoinByCodeRequest struct {
	InviteCode string `json:"invite_code" example:"XK9F2M"`
}

type SendInviteRequest struct {
	UserID string `json:"user_id" example:"665b1a2b3c4d5e6f7a8b9c0d"`
}

type CreateBetRequest struct {
	Title        string              `json:"title" example:"Sam won't hike the Y before spring"`
	Description  string              `json:"description" example:"Sam has lived in Provo for 2 years..."`
	EndDate      string              `json:"end_date" example:"2026-04-01T23:59:59Z"`
	DeciderID    string              `json:"decider_id" example:"665b1a2b3c4d5e6f7a8b9c0d"`
	OpeningWager OpeningWagerRequest `json:"opening_wager"`
}

type OpeningWagerRequest struct {
	Side   string `json:"side" example:"FOR" enums:"FOR,AGAINST"`
	Amount int    `json:"amount" example:"100"`
}

type PlaceWagerRequest struct {
	Side   string `json:"side" example:"AGAINST" enums:"FOR,AGAINST"`
	Amount int    `json:"amount" example:"200"`
}

type ChangeDeciderRequest struct {
	DeciderID string `json:"decider_id" example:"665b1a2b3c4d5e6f7a8b9c0d"`
}

type ResolveRequest struct {
	WinningSide string `json:"winning_side" example:"FOR" enums:"FOR,AGAINST"`
}

// --- Responses ---

type ErrorResponse struct {
	Error ErrorDetail `json:"error"`
}

type ErrorDetail struct {
	Code    string `json:"code" example:"NOT_FOUND"`
	Message string `json:"message" example:"not found"`
}

type UserSearchResponse struct {
	Users []UserSearchResult `json:"users"`
}

type UserSearchResult struct {
	ID        string  `json:"id" example:"665a1a2b3c4d5e6f7a8b9c0d"`
	FirstName string  `json:"first_name" example:"Orion"`
	LastName  string  `json:"last_name" example:"Smith"`
	Username  string  `json:"username" example:"orion"`
	AvatarURL *string `json:"avatar_url"`
}

type GroupListResponse struct {
	Groups []interface{} `json:"groups"`
}

type InviteListResponse struct {
	Invites []interface{} `json:"invites"`
}

type BetListResponse struct {
	Bets []interface{} `json:"bets"`
}

type NotificationListResponse struct {
	Notifications []interface{} `json:"notifications"`
	HasMore       bool          `json:"has_more" example:"true"`
}

type UnreadCountResponse struct {
	Count int64 `json:"count" example:"3"`
}

type MarkReadResponse struct {
	ID   string `json:"id" example:"665e1a2b3c4d5e6f7a8b9c0d"`
	Read bool   `json:"read" example:"true"`
}

type MarkAllReadResponse struct {
	Updated int64 `json:"updated" example:"3"`
}

type InviteAcceptResponse struct {
	ID      string `json:"id" example:"665d1a2b3c4d5e6f7a8b9c0d"`
	Status  string `json:"status" example:"ACCEPTED"`
	GroupID string `json:"group_id" example:"665c1a2b3c4d5e6f7a8b9c0d"`
}

type InviteDeclineResponse struct {
	ID     string `json:"id" example:"665d1a2b3c4d5e6f7a8b9c0d"`
	Status string `json:"status" example:"DECLINED"`
}

type ResolveResponse struct {
	ID          string        `json:"id" example:"665f1a2b3c4d5e6f7a8b9c0d"`
	Status      string        `json:"status" example:"RESOLVED"`
	WinningSide string        `json:"winning_side" example:"FOR"`
	ResolvedAt  string        `json:"resolved_at" example:"2026-04-02T15:30:00Z"`
	Payouts     []PayoutEntry `json:"payouts"`
}

type PayoutEntry struct {
	UserID string `json:"user_id" example:"665a1a2b3c4d5e6f7a8b9c0d"`
	Name   string `json:"name" example:"Sam"`
	Amount int    `json:"amount" example:"175"`
	Net    int    `json:"net" example:"75"`
}
