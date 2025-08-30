package coordination

import (
	v1 "github.com/panyam/turnengine/engine/gen/go/turnengine/v1"
)

// Storage interface for coordinator - game-agnostic
// Uses gameID as sessionID for simplicity
type Storage interface {
	// Session operations (gameID is the sessionID)
	GetSession(gameID string) (*v1.GameSession, error)
	CreateSession(session *v1.GameSession) error
	UpdateSession(session *v1.GameSession) error
	DeleteSession(gameID string) error
	
	// Atomic update with callback
	AtomicUpdate(gameID string, updateFn func(*v1.GameSession) error) error
	
	// Proposal operations
	GetProposal(gameID, proposalID string) (*v1.ProposalInfo, error)
	ArchiveProposal(gameID string, proposal *v1.ProposalInfo, status string) error
	
	// Validation operations
	GetPendingValidationForGame(gameID, validatorID string) (*v1.PendingValidation, error)
}