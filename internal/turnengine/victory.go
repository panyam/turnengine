package turnengine

import (
	"fmt"
)

type VictoryCondition interface {
	Name() string
	Description() string
	CheckVictory(gameState *GameState) *VictoryResult
	IsActive() bool
}

type VictoryResult struct {
	Achieved    bool     `json:"achieved"`
	Winners     []string `json:"winners"`
	Losers      []string `json:"losers"`
	Condition   string   `json:"condition"`
	Description string   `json:"description"`
	Progress    float64  `json:"progress"`
}

type VictoryManager struct {
	conditions []VictoryCondition
	gameOver   bool
	result     *VictoryResult
}

func NewVictoryManager() *VictoryManager {
	return &VictoryManager{
		conditions: make([]VictoryCondition, 0),
		gameOver:   false,
	}
}

func (vm *VictoryManager) AddCondition(condition VictoryCondition) {
	vm.conditions = append(vm.conditions, condition)
}

func (vm *VictoryManager) RemoveCondition(conditionName string) {
	for i, condition := range vm.conditions {
		if condition.Name() == conditionName {
			vm.conditions = append(vm.conditions[:i], vm.conditions[i+1:]...)
			break
		}
	}
}

func (vm *VictoryManager) CheckVictory(gameState *GameState) *VictoryResult {
	if vm.gameOver {
		return vm.result
	}
	
	for _, condition := range vm.conditions {
		if !condition.IsActive() {
			continue
		}
		
		result := condition.CheckVictory(gameState)
		if result != nil && result.Achieved {
			vm.gameOver = true
			vm.result = result
			return result
		}
	}
	
	return nil
}

func (vm *VictoryManager) GetProgress(gameState *GameState) map[string]float64 {
	progress := make(map[string]float64)
	
	for _, condition := range vm.conditions {
		if condition.IsActive() {
			result := condition.CheckVictory(gameState)
			if result != nil {
				progress[condition.Name()] = result.Progress
			}
		}
	}
	
	return progress
}

func (vm *VictoryManager) IsGameOver() bool {
	return vm.gameOver
}

func (vm *VictoryManager) GetResult() *VictoryResult {
	return vm.result
}

func (vm *VictoryManager) Reset() {
	vm.gameOver = false
	vm.result = nil
}

type EliminateAllCondition struct {
	active bool
}

func NewEliminateAllCondition() *EliminateAllCondition {
	return &EliminateAllCondition{active: true}
}

func (eac *EliminateAllCondition) Name() string {
	return "eliminate_all"
}

func (eac *EliminateAllCondition) Description() string {
	return "Eliminate all enemy units"
}

func (eac *EliminateAllCondition) IsActive() bool {
	return eac.active
}

func (eac *EliminateAllCondition) CheckVictory(gameState *GameState) *VictoryResult {
	playerUnits := make(map[string]int)
	
	for _, entity := range gameState.World.GetEntities() {
		if !entity.HasComponent("team") || !entity.HasComponent("health") {
			continue
		}
		
		team, exists := entity.GetComponent("team")
		if !exists {
			continue
		}
		
		health, exists := entity.GetComponent("health")
		if !exists {
			continue
		}
		
		teamID, ok := team["teamId"].(float64)
		if !ok {
			continue
		}
		
		currentHealth, ok := health["current"].(float64)
		if !ok || currentHealth <= 0 {
			continue
		}
		
		playerKey := fmt.Sprintf("team_%d", int(teamID))
		playerUnits[playerKey]++
	}
	
	var teamsWithUnits []string
	totalUnits := 0
	
	for team, units := range playerUnits {
		if units > 0 {
			teamsWithUnits = append(teamsWithUnits, team)
			totalUnits += units
		}
	}
	
	result := &VictoryResult{
		Condition:   eac.Name(),
		Description: eac.Description(),
	}
	
	if len(teamsWithUnits) <= 1 && totalUnits > 0 {
		result.Achieved = true
		result.Winners = teamsWithUnits
		
		for _, player := range gameState.Players {
			playerKey := fmt.Sprintf("team_%d", player.Team)
			found := false
			for _, winner := range teamsWithUnits {
				if winner == playerKey {
					found = true
					break
				}
			}
			if !found {
				result.Losers = append(result.Losers, player.ID)
			}
		}
	} else if len(teamsWithUnits) > 1 {
		result.Progress = 1.0 - (float64(len(teamsWithUnits)-1) / float64(len(gameState.Players)-1))
	}
	
	return result
}

type CaptureObjectiveCondition struct {
	active        bool
	objectiveType string
	requiredCount int
}

func NewCaptureObjectiveCondition(objectiveType string, requiredCount int) *CaptureObjectiveCondition {
	return &CaptureObjectiveCondition{
		active:        true,
		objectiveType: objectiveType,
		requiredCount: requiredCount,
	}
}

func (coc *CaptureObjectiveCondition) Name() string {
	return fmt.Sprintf("capture_%s", coc.objectiveType)
}

func (coc *CaptureObjectiveCondition) Description() string {
	return fmt.Sprintf("Capture %d %s objectives", coc.requiredCount, coc.objectiveType)
}

func (coc *CaptureObjectiveCondition) IsActive() bool {
	return coc.active
}

func (coc *CaptureObjectiveCondition) CheckVictory(gameState *GameState) *VictoryResult {
	playerCaptures := make(map[string]int)
	totalObjectives := 0
	
	for _, entity := range gameState.World.GetEntities() {
		if !entity.HasComponent("terrain") {
			continue
		}
		
		terrain, exists := entity.GetComponent("terrain")
		if !exists {
			continue
		}
		
		terrainType, ok := terrain["terrainType"].(string)
		if !ok || terrainType != coc.objectiveType {
			continue
		}
		
		totalObjectives++
		
		owner, ok := terrain["owner"].(float64)
		if ok && owner > 0 {
			playerKey := fmt.Sprintf("team_%d", int(owner))
			playerCaptures[playerKey]++
		}
	}
	
	result := &VictoryResult{
		Condition:   coc.Name(),
		Description: coc.Description(),
	}
	
	for playerKey, captures := range playerCaptures {
		if captures >= coc.requiredCount {
			result.Achieved = true
			result.Winners = []string{playerKey}
			
			for _, player := range gameState.Players {
				otherPlayerKey := fmt.Sprintf("team_%d", player.Team)
				if otherPlayerKey != playerKey {
					result.Losers = append(result.Losers, player.ID)
				}
			}
			break
		}
	}
	
	if !result.Achieved && totalObjectives > 0 {
		maxCaptures := 0
		for _, captures := range playerCaptures {
			if captures > maxCaptures {
				maxCaptures = captures
			}
		}
		result.Progress = float64(maxCaptures) / float64(coc.requiredCount)
	}
	
	return result
}

type SurvivalCondition struct {
	active    bool
	maxTurns  int
}

func NewSurvivalCondition(maxTurns int) *SurvivalCondition {
	return &SurvivalCondition{
		active:   true,
		maxTurns: maxTurns,
	}
}

func (sc *SurvivalCondition) Name() string {
	return "survival"
}

func (sc *SurvivalCondition) Description() string {
	return fmt.Sprintf("Survive for %d turns", sc.maxTurns)
}

func (sc *SurvivalCondition) IsActive() bool {
	return sc.active
}

func (sc *SurvivalCondition) CheckVictory(gameState *GameState) *VictoryResult {
	result := &VictoryResult{
		Condition:   sc.Name(),
		Description: sc.Description(),
		Progress:    float64(gameState.CurrentTurn) / float64(sc.maxTurns),
	}
	
	if gameState.CurrentTurn >= sc.maxTurns {
		result.Achieved = true
		
		playerUnits := make(map[string]int)
		for _, entity := range gameState.World.GetEntities() {
			if !entity.HasComponent("team") || !entity.HasComponent("health") {
				continue
			}
			
			team, exists := entity.GetComponent("team")
			if !exists {
				continue
			}
			
			health, exists := entity.GetComponent("health")
			if !exists {
				continue
			}
			
			teamID, ok := team["teamId"].(float64)
			if !ok {
				continue
			}
			
			currentHealth, ok := health["current"].(float64)
			if !ok || currentHealth <= 0 {
				continue
			}
			
			playerUnits[fmt.Sprintf("team_%d", int(teamID))]++
		}
		
		for playerKey, units := range playerUnits {
			if units > 0 {
				result.Winners = append(result.Winners, playerKey)
			}
		}
		
		for _, player := range gameState.Players {
			playerKey := fmt.Sprintf("team_%d", player.Team)
			if playerUnits[playerKey] == 0 {
				result.Losers = append(result.Losers, player.ID)
			}
		}
	}
	
	return result
}

type ScoreCondition struct {
	active      bool
	targetScore int
	scoreType   string
}

func NewScoreCondition(scoreType string, targetScore int) *ScoreCondition {
	return &ScoreCondition{
		active:      true,
		targetScore: targetScore,
		scoreType:   scoreType,
	}
}

func (sc *ScoreCondition) Name() string {
	return fmt.Sprintf("score_%s", sc.scoreType)
}

func (sc *ScoreCondition) Description() string {
	return fmt.Sprintf("Reach %d %s points", sc.targetScore, sc.scoreType)
}

func (sc *ScoreCondition) IsActive() bool {
	return sc.active
}

func (sc *ScoreCondition) CheckVictory(gameState *GameState) *VictoryResult {
	result := &VictoryResult{
		Condition:   sc.Name(),
		Description: sc.Description(),
	}
	
	maxScore := 0
	
	for _, player := range gameState.Players {
		if score, exists := player.Resources[sc.scoreType]; exists {
			if scoreInt, ok := score.(float64); ok {
				playerScore := int(scoreInt)
				if playerScore > maxScore {
					maxScore = playerScore
				}
				
				if playerScore >= sc.targetScore {
					result.Achieved = true
					result.Winners = []string{player.ID}
					
					for _, otherPlayer := range gameState.Players {
						if otherPlayer.ID != player.ID {
							result.Losers = append(result.Losers, otherPlayer.ID)
						}
					}
					break
				}
			}
		}
	}
	
	if !result.Achieved && sc.targetScore > 0 {
		result.Progress = float64(maxScore) / float64(sc.targetScore)
	}
	
	return result
}