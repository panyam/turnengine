package turnengine

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
)

type GameRules struct {
	GameType        string                 `json:"gameType"`
	BoardType       string                 `json:"boardType"`
	TurnStructure   string                 `json:"turnStructure"`
	ComponentTypes  map[string]interface{} `json:"componentTypes"`
	SystemConfig    map[string]interface{} `json:"systemConfig"`
	VictoryConditions []string             `json:"victoryConditions"`
	TimeConfig      TimeConfig             `json:"timeConfig"`
	Metadata        map[string]interface{} `json:"metadata"`
}

type TimeConfig struct {
	Type          string `json:"type"`
	TurnLength    int    `json:"turnLength"`
	MaxTurnTime   int    `json:"maxTurnTime"`
	ProductionCycle int  `json:"productionCycle"`
}

type RuleValidator interface {
	ValidateRules(rules *GameRules) error
}

type RuleManager struct {
	validators map[string]RuleValidator
}

func NewRuleManager() *RuleManager {
	return &RuleManager{
		validators: make(map[string]RuleValidator),
	}
}

func (rm *RuleManager) RegisterValidator(gameType string, validator RuleValidator) {
	rm.validators[gameType] = validator
}

func (rm *RuleManager) ValidateRules(rules *GameRules) error {
	if validator, exists := rm.validators[rules.GameType]; exists {
		return validator.ValidateRules(rules)
	}
	return fmt.Errorf("no validator registered for game type: %s", rules.GameType)
}

func (rm *RuleManager) LoadRulesFromFile(filename string) (*GameRules, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, fmt.Errorf("failed to open rules file: %w", err)
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("failed to read rules file: %w", err)
	}

	var rules GameRules
	if err := json.Unmarshal(data, &rules); err != nil {
		return nil, fmt.Errorf("failed to parse rules JSON: %w", err)
	}

	if err := rm.ValidateRules(&rules); err != nil {
		return nil, fmt.Errorf("rule validation failed: %w", err)
	}

	return &rules, nil
}

func (rm *RuleManager) LoadRulesFromJSON(data []byte) (*GameRules, error) {
	var rules GameRules
	if err := json.Unmarshal(data, &rules); err != nil {
		return nil, fmt.Errorf("failed to parse rules JSON: %w", err)
	}

	if err := rm.ValidateRules(&rules); err != nil {
		return nil, fmt.Errorf("rule validation failed: %w", err)
	}

	return &rules, nil
}

func (rules *GameRules) ToJSON() ([]byte, error) {
	return json.Marshal(rules)
}

func (rules *GameRules) SaveToFile(filename string) error {
	data, err := rules.ToJSON()
	if err != nil {
		return fmt.Errorf("failed to serialize rules: %w", err)
	}

	if err := os.WriteFile(filename, data, 0644); err != nil {
		return fmt.Errorf("failed to write rules file: %w", err)
	}

	return nil
}

func (rules *GameRules) GetComponentTypeConfig(componentType string) (interface{}, bool) {
	config, exists := rules.ComponentTypes[componentType]
	return config, exists
}

func (rules *GameRules) GetSystemConfig(systemName string) (interface{}, bool) {
	config, exists := rules.SystemConfig[systemName]
	return config, exists
}

func (rules *GameRules) Clone() *GameRules {
	data, _ := json.Marshal(rules)
	var clone GameRules
	json.Unmarshal(data, &clone)
	return &clone
}

type BasicRuleValidator struct{}

func (brv *BasicRuleValidator) ValidateRules(rules *GameRules) error {
	if rules.GameType == "" {
		return fmt.Errorf("gameType is required")
	}

	if rules.BoardType == "" {
		return fmt.Errorf("boardType is required")
	}

	if rules.TurnStructure == "" {
		return fmt.Errorf("turnStructure is required")
	}

	validTurnStructures := []string{"turn-based", "real-time-slow", "real-time-fast"}
	validStructure := false
	for _, valid := range validTurnStructures {
		if rules.TurnStructure == valid {
			validStructure = true
			break
		}
	}
	if !validStructure {
		return fmt.Errorf("invalid turnStructure: %s", rules.TurnStructure)
	}

	if len(rules.VictoryConditions) == 0 {
		return fmt.Errorf("at least one victory condition is required")
	}

	return nil
}