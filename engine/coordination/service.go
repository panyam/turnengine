package coordination

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"time"
	
	v1 "github.com/panyam/turnengine/engine/gen/go/turnengine/v1"
	"github.com/panyam/turnengine/engine/storage"
	"google.golang.org/protobuf/types/known/timestamppb"
)

var (
	ErrNotYourTurn       = errors.New("not your turn")
	ErrProposalInProgress = errors.New("proposal already in progress")
	ErrStateMismatch     = errors.New("state mismatch - please refresh")
	ErrProposalNotFound  = errors.New("proposal not found")
	ErrNotAssignedValidator = errors.New("not an assigned validator")
	ErrAlreadyVoted      = errors.New("already voted on this proposal")
)

// Config for the coordinator service
type Config struct {
	RequiredValidators int           // K value for K-of-N consensus
	ValidationTimeout  time.Duration // How long validators have to vote
}

// Callbacks that the game service can implement to handle proposal lifecycle
type Callbacks interface {
	// Called when a proposal is accepted and validation begins
	OnProposalStarted(gameID string, proposal *v1.ProposalInfo) error
	
	// Called when consensus approves the proposal
	OnProposalAccepted(gameID string, proposal *v1.ProposalInfo) error
	
	// Called when proposal is rejected or times out
	OnProposalFailed(gameID string, proposal *v1.ProposalInfo, reason string) error
}

// Service implements game-agnostic coordination
type Service struct {
	storage   Storage
	config    Config
	callbacks Callbacks
}

// NewService creates a new coordinator service
func NewService(storage Storage, config Config, callbacks Callbacks) *Service {
	// Set defaults
	if config.RequiredValidators == 0 {
		config.RequiredValidators = 1 // Default to 1 validator
	}
	if config.ValidationTimeout == 0 {
		config.ValidationTimeout = 5 * time.Minute // Default 5 minutes
	}
	
	return &Service{
		storage:   storage,
		config:    config,
		callbacks: callbacks,
	}
}

// SubmitProposal submits a new proposal for validation
// This is completely game-agnostic - it just manages the consensus process
func (s *Service) SubmitProposal(ctx context.Context, req *v1.SubmitProposalRequest) (*v1.SubmitProposalResponse, error) {
	var proposalID string
	var validators []string
	var proposal *v1.ProposalInfo
	
	// Atomic update to prevent race conditions
	err := s.storage.AtomicUpdate(req.SessionId, func(session *v1.GameSession) error {
		// Check if there's already an active proposal
		if session.ActiveProposal != nil {
			phase := session.ActiveProposal.Phase
			if phase == v1.ProposalPhase_PROPOSAL_PHASE_COLLECTING ||
			   phase == v1.ProposalPhase_PROPOSAL_PHASE_FINALIZING {
				return ErrProposalInProgress
			}
		}
		
		// Check if it's the proposer's turn
		if session.CurrentPlayerId != req.ProposerId {
			return ErrNotYourTurn
		}
		
		// Verify state hash matches
		if session.CurrentStateHash != req.FromStateHash {
			return ErrStateMismatch
		}
		
		// Generate proposal ID
		id, err := storage.NewRandomId()
		if err != nil {
			return err
		}
		proposalID = id
		
		// Select validators (excluding proposer)
		validators = s.selectValidators(session, req.ProposerId)
		if len(validators) == 0 {
			return errors.New("no validators available")
		}
		
		// Create the proposal
		proposal = &v1.ProposalInfo{
			ProposalId:      proposalID,
			SessionId:       req.SessionId,
			ProposerId:      req.ProposerId,
			FromStateHash:   req.FromStateHash,
			ToStateHash:     req.ToStateHash,
			MovesBlob:       req.MovesBlob,
			ChangesBlob:     req.ChangesBlob,
			NewStateBlob:    req.NewStateBlob,
			AssignedValidators: validators,
			Votes:           make(map[string]*v1.ValidationVote),
			Phase:           v1.ProposalPhase_PROPOSAL_PHASE_COLLECTING,
			CreatedAt:       timestamppb.Now(),
			Deadline:        timestamppb.New(time.Now().Add(s.config.ValidationTimeout)),
			Nonce:           req.Nonce,
		}
		
		// Set the active proposal
		session.ActiveProposal = proposal
		
		return nil
	})
	
	if err != nil {
		return &v1.SubmitProposalResponse{
			Status: v1.SubmitProposalResponse_STATUS_REJECTED,
			Reason: err.Error(),
		}, nil
	}
	
	// Notify the game service that a proposal has started
	if s.callbacks != nil {
		if err := s.callbacks.OnProposalStarted(req.SessionId, proposal); err != nil {
			// Log but don't fail the proposal
			fmt.Printf("Warning: OnProposalStarted callback failed: %v\n", err)
		}
	}
	
	return &v1.SubmitProposalResponse{
		Status:             v1.SubmitProposalResponse_STATUS_ACCEPTED,
		ProposalId:         proposalID,
		AssignedValidators: validators,
	}, nil
}

// SubmitValidation records a validator's vote
func (s *Service) SubmitValidation(ctx context.Context, req *v1.SubmitValidationRequest) (*v1.SubmitValidationResponse, error) {
	var consensusReached bool
	var consensusApproved bool
	var proposal *v1.ProposalInfo
	var rejections int
	
	err := s.storage.AtomicUpdate(req.SessionId, func(session *v1.GameSession) error {
		// Check proposal exists and matches
		if session.ActiveProposal == nil || session.ActiveProposal.ProposalId != req.ProposalId {
			return ErrProposalNotFound
		}
		
		proposal = session.ActiveProposal
		
		// Check if validator is assigned
		isAssigned := false
		for _, v := range proposal.AssignedValidators {
			if v == req.ValidatorId {
				isAssigned = true
				break
			}
		}
		if !isAssigned {
			return ErrNotAssignedValidator
		}
		
		// Check if already voted
		if _, exists := proposal.Votes[req.ValidatorId]; exists {
			return ErrAlreadyVoted
		}
		
		// Record the vote
		proposal.Votes[req.ValidatorId] = &v1.ValidationVote{
			ValidatorId:  req.ValidatorId,
			Approved:     req.Approved,
			ComputedHash: req.ComputedHash,
			ErrorReason:  req.ErrorReason,
			SubmittedAt:  timestamppb.Now(),
			Signature:    req.Signature,
		}
		
		// Check for consensus
		approvals := 0
		rejections = 0
		
		for _, vote := range proposal.Votes {
			if vote.Approved && vote.ComputedHash == proposal.ToStateHash {
				approvals++
			} else {
				rejections++
			}
		}
		
		// Do we have enough approvals?
		if approvals >= s.config.RequiredValidators {
			consensusReached = true
			consensusApproved = true
			
			// Update coordinator's view of the state
			session.CurrentStateHash = proposal.ToStateHash
			session.CurrentStateBlob = proposal.NewStateBlob
			session.CurrentTick++
			
			// Move to next player
			session.CurrentPlayerId = s.getNextPlayer(session)
			
			// Update proposal phase
			proposal.Phase = v1.ProposalPhase_PROPOSAL_PHASE_COMMITTED
			
			// Archive the proposal
			s.storage.ArchiveProposal(req.SessionId, proposal, "COMMITTED")
			
			// Clear active proposal
			session.ActiveProposal = nil
			
		} else if rejections > len(proposal.AssignedValidators) - s.config.RequiredValidators {
			// Too many rejections - consensus cannot be reached
			consensusReached = true
			consensusApproved = false
			
			// Update proposal phase
			proposal.Phase = v1.ProposalPhase_PROPOSAL_PHASE_REJECTED
			
			// Archive the proposal
			s.storage.ArchiveProposal(req.SessionId, proposal, "REJECTED")
			
			// Clear active proposal
			session.ActiveProposal = nil
		}
		
		return nil
	})
	
	if err != nil {
		return nil, err
	}
	
	// Notify game service of the outcome
	if consensusReached && s.callbacks != nil {
		if consensusApproved {
			// Proposal was accepted
			if err := s.callbacks.OnProposalAccepted(req.SessionId, proposal); err != nil {
				fmt.Printf("Warning: OnProposalAccepted callback failed: %v\n", err)
			}
		} else {
			// Proposal was rejected
			reason := fmt.Sprintf("Consensus rejected: %d rejections", rejections)
			if err := s.callbacks.OnProposalFailed(req.SessionId, proposal, reason); err != nil {
				fmt.Printf("Warning: OnProposalFailed callback failed: %v\n", err)
			}
		}
	}
	
	return &v1.SubmitValidationResponse{
		Recorded:          true,
		ConsensusReached:  consensusReached,
		ConsensusApproved: consensusApproved,
	}, nil
}

// GetProposalStatus returns the current status of a proposal
func (s *Service) GetProposalStatus(ctx context.Context, req *v1.GetProposalStatusRequest) (*v1.GetProposalStatusResponse, error) {
	// Get the proposal
	proposal, err := s.storage.GetProposal(req.ProposalId, req.ProposalId) // gameID not known here
	if err != nil {
		// Try to get from session if we have session ID
		// For now, return error
		return nil, err
	}
	
	return &v1.GetProposalStatusResponse{
		Proposal:      proposal,
		Phase:         proposal.Phase,
		VotesReceived: int32(len(proposal.Votes)),
		VotesRequired: int32(s.config.RequiredValidators),
	}, nil
}

// GetPendingValidations returns validations pending for a validator
func (s *Service) GetPendingValidations(ctx context.Context, req *v1.GetPendingValidationsRequest) (*v1.GetPendingValidationsResponse, error) {
	// In a simple implementation, validators need to specify which games they're checking
	// For now, return empty - validators will check specific games
	return &v1.GetPendingValidationsResponse{
		Validations: []*v1.PendingValidation{},
	}, nil
}

// GetPendingValidationForGame checks if a specific game needs validation from a validator
func (s *Service) GetPendingValidationForGame(gameID, validatorID string) (*v1.PendingValidation, error) {
	return s.storage.GetPendingValidationForGame(gameID, validatorID)
}

// CheckExpiredProposals checks for and handles expired proposals
// This should be called periodically by the game service
func (s *Service) CheckExpiredProposals() error {
	// This would iterate through sessions and check for expired proposals
	// For now, this is a placeholder
	// The game service can call this periodically and handle timeouts via OnProposalFailed
	return nil
}

// Helper methods

func (s *Service) selectValidators(session *v1.GameSession, excludePlayer string) []string {
	var validators []string
	
	// Select from other players in the game
	for _, playerID := range session.PlayerIds {
		if playerID != excludePlayer {
			validators = append(validators, playerID)
			if len(validators) >= s.config.RequiredValidators {
				break
			}
		}
	}
	
	return validators
}

func (s *Service) getNextPlayer(session *v1.GameSession) string {
	if len(session.PlayerIds) == 0 {
		return ""
	}
	
	// Find current player index
	currentIndex := -1
	for i, pid := range session.PlayerIds {
		if pid == session.CurrentPlayerId {
			currentIndex = i
			break
		}
	}
	
	// Move to next player (wrap around)
	nextIndex := (currentIndex + 1) % len(session.PlayerIds)
	return session.PlayerIds[nextIndex]
}

// ComputeStateHash computes a hash of state blob
func ComputeStateHash(stateBlob []byte, nonce string) string {
	h := sha256.New()
	h.Write(stateBlob)
	h.Write([]byte(nonce))
	return hex.EncodeToString(h.Sum(nil))
}