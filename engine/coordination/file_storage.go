package coordination

import (
	"fmt"
	"time"

	v1 "github.com/panyam/turnengine/engine/gen/go/turnengine/v1/models"
	"github.com/panyam/turnengine/engine/storage"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// FileCoordinationStorage implements Storage using the generic FileStorage
// It stores coordination data alongside game data, using gameID as the sessionID
type FileCoordinationStorage struct {
	fs *storage.FileStorage
}

func NewFileCoordinationStorage(baseDir string) (*FileCoordinationStorage, error) {
	if baseDir == "" {
		baseDir = "./gamedata/coordination"
	}

	fs := storage.NewFileStorage(baseDir)

	return &FileCoordinationStorage{
		fs: fs,
	}, nil
}

// GetSession loads a session from disk (gameID is the sessionID)
func (fcs *FileCoordinationStorage) GetSession(gameID string) (*v1.GameSession, error) {
	session := &v1.GameSession{}
	err := fcs.fs.LoadArtifact(gameID, "session", session)
	if err != nil {
		return nil, fmt.Errorf("failed to load session %s: %w", gameID, err)
	}
	return session, nil
}

// CreateSession creates a new session for a game
func (fcs *FileCoordinationStorage) CreateSession(session *v1.GameSession) error {
	// Game ID must be provided (it's our session ID)
	if session.SessionId == "" {
		return fmt.Errorf("session ID (game ID) is required")
	}

	// Check if already exists
	exists, err := fcs.fs.EntityExists(session.SessionId)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("session already exists: %s", session.SessionId)
	}

	// Set timestamps
	now := timestamppb.Now()
	session.CreatedAt = now
	session.UpdatedAt = now

	// Save session as main artifact
	return fcs.fs.SaveArtifact(session.SessionId, "session", session)
}

// UpdateSession updates an existing session
func (fcs *FileCoordinationStorage) UpdateSession(session *v1.GameSession) error {
	session.UpdatedAt = timestamppb.Now()
	return fcs.fs.AtomicSaveArtifact(session.SessionId, "session", session)
}

// DeleteSession removes a session
func (fcs *FileCoordinationStorage) DeleteSession(gameID string) error {
	return fcs.fs.DeleteEntity(gameID)
}

// AtomicUpdate performs an atomic update on a session
func (fcs *FileCoordinationStorage) AtomicUpdate(gameID string, updateFn func(*v1.GameSession) error) error {
	session := &v1.GameSession{}

	return fcs.fs.AtomicUpdate(gameID, "session", func(msg proto.Message) error {
		// Cast to GameSession
		s := msg.(*v1.GameSession)

		// Apply update
		if err := updateFn(s); err != nil {
			return err
		}

		// Update timestamp
		s.UpdatedAt = timestamppb.Now()
		return nil
	}, session)
}

// GetProposal retrieves a specific proposal by ID (if we store them separately)
func (fcs *FileCoordinationStorage) GetProposal(gameID, proposalID string) (*v1.ProposalInfo, error) {
	// First try to get it from the active proposal in session
	session, err := fcs.GetSession(gameID)
	if err != nil {
		return nil, err
	}

	if session.ActiveProposal != nil && session.ActiveProposal.ProposalId == proposalID {
		return session.ActiveProposal, nil
	}

	// Otherwise, try to load from archived proposals
	proposal := &v1.ProposalInfo{}
	artifactName := fmt.Sprintf("proposal-%s", proposalID)
	err = fcs.fs.LoadArtifact(gameID, artifactName, proposal)
	if err != nil {
		return nil, fmt.Errorf("proposal not found: %s", proposalID)
	}

	return proposal, nil
}

// ArchiveProposal saves a completed/rejected proposal as an artifact
func (fcs *FileCoordinationStorage) ArchiveProposal(gameID string, proposal *v1.ProposalInfo, status string) error {
	// Create archive name with timestamp
	timestamp := time.Now().Format("20060102-150405")
	archiveName := fmt.Sprintf("proposal-%s-%s-%s", timestamp, proposal.ProposalId, status)

	// Save proposal as an artifact in the game's directory
	return fcs.fs.SaveArtifact(gameID, archiveName, proposal)
}

// GetPendingValidations gets validations needed by a specific validator
// This is called when a validator polls for work
func (fcs *FileCoordinationStorage) GetPendingValidations(validatorID string) ([]*v1.PendingValidation, error) {
	// For now, return empty - validators will need to know their game IDs
	// In a real implementation, we might maintain a separate index
	// But for simplicity, validators will check specific games they're in
	return []*v1.PendingValidation{}, nil
}

// GetPendingValidationForGame checks if a game needs validation from a specific validator
func (fcs *FileCoordinationStorage) GetPendingValidationForGame(gameID, validatorID string) (*v1.PendingValidation, error) {
	session, err := fcs.GetSession(gameID)
	if err != nil {
		return nil, err
	}

	if session.ActiveProposal == nil {
		return nil, nil // No active proposal
	}

	// Check if validator is assigned
	isAssigned := false
	for _, v := range session.ActiveProposal.AssignedValidators {
		if v == validatorID {
			isAssigned = true
			break
		}
	}

	if !isAssigned {
		return nil, nil // Not assigned to this validator
	}

	// Check if already voted
	if _, voted := session.ActiveProposal.Votes[validatorID]; voted {
		return nil, nil // Already voted
	}

	// Return pending validation
	return &v1.PendingValidation{
		SessionId:     gameID,
		ProposalId:    session.ActiveProposal.ProposalId,
		ProposerId:    session.ActiveProposal.ProposerId,
		FromStateHash: session.ActiveProposal.FromStateHash,
		MovesBlob:     session.ActiveProposal.MovesBlob,
		ChangesBlob:   session.ActiveProposal.ChangesBlob,
		Deadline:      session.ActiveProposal.Deadline,
		Nonce:         session.ActiveProposal.Nonce,
	}, nil
}
