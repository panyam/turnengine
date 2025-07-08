package turnengine

import (
	"fmt"
	"math/rand"
)

type CombatStats struct {
	Attack        int     `json:"attack"`
	Defense       int     `json:"defense"`
	Health        int     `json:"health"`
	MaxHealth     int     `json:"maxHealth"`
	AttackRange   int     `json:"attackRange"`
	Accuracy      float64 `json:"accuracy"`
	CriticalChance float64 `json:"criticalChance"`
}

type CombatResult struct {
	AttackerDamage int  `json:"attackerDamage"`
	DefenderDamage int  `json:"defenderDamage"`
	AttackerKilled bool `json:"attackerKilled"`
	DefenderKilled bool `json:"defenderKilled"`
	Hit            bool `json:"hit"`
	Critical       bool `json:"critical"`
}

type CombatResolver interface {
	ResolveCombat(attacker, defender CombatStats, terrain TerrainModifiers) CombatResult
	CalculateDamage(attackerStats, defenderStats CombatStats, terrain TerrainModifiers) int
	CanAttack(attackerPos, defenderPos Position, attackRange int, board Board) bool
}

type TerrainModifiers struct {
	DefenseBonus   int     `json:"defenseBonus"`
	AttackPenalty  int     `json:"attackPenalty"`
	AccuracyBonus  float64 `json:"accuracyBonus"`
	CoverBonus     int     `json:"coverBonus"`
}

type DeterministicCombatResolver struct{}

func (dcr *DeterministicCombatResolver) ResolveCombat(attacker, defender CombatStats, terrain TerrainModifiers) CombatResult {
	result := CombatResult{}
	
	if !dcr.rollToHit(attacker.Accuracy + terrain.AccuracyBonus) {
		result.Hit = false
		return result
	}
	
	result.Hit = true
	result.Critical = dcr.rollCritical(attacker.CriticalChance)
	
	damage := dcr.CalculateDamage(attacker, defender, terrain)
	if result.Critical {
		damage *= 2
	}
	
	result.DefenderDamage = damage
	result.DefenderKilled = (defender.Health - damage) <= 0
	
	if defender.Health > damage {
		counterDamage := dcr.CalculateDamage(defender, attacker, TerrainModifiers{})
		result.AttackerDamage = counterDamage
		result.AttackerKilled = (attacker.Health - counterDamage) <= 0
	}
	
	return result
}

func (dcr *DeterministicCombatResolver) CalculateDamage(attackerStats, defenderStats CombatStats, terrain TerrainModifiers) int {
	baseAttack := attackerStats.Attack - terrain.AttackPenalty
	if baseAttack < 0 {
		baseAttack = 0
	}
	
	effectiveDefense := defenderStats.Defense + terrain.DefenseBonus + terrain.CoverBonus
	
	damage := baseAttack - effectiveDefense/2
	if damage < 1 {
		damage = 1
	}
	
	healthRatio := float64(attackerStats.Health) / float64(attackerStats.MaxHealth)
	damage = int(float64(damage) * healthRatio)
	
	if damage < 1 {
		damage = 1
	}
	
	return damage
}

func (dcr *DeterministicCombatResolver) CanAttack(attackerPos, defenderPos Position, attackRange int, board Board) bool {
	distance := board.GetDistance(attackerPos, defenderPos)
	return distance <= attackRange && distance >= 1
}

func (dcr *DeterministicCombatResolver) rollToHit(accuracy float64) bool {
	if accuracy >= 1.0 {
		return true
	}
	return rand.Float64() < accuracy
}

func (dcr *DeterministicCombatResolver) rollCritical(critChance float64) bool {
	if critChance <= 0 {
		return false
	}
	return rand.Float64() < critChance
}

type ProbabilisticCombatResolver struct {
	RandomSeed int64
}

func (pcr *ProbabilisticCombatResolver) ResolveCombat(attacker, defender CombatStats, terrain TerrainModifiers) CombatResult {
	result := CombatResult{}
	
	hitChance := pcr.calculateHitChance(attacker, defender, terrain)
	if rand.Float64() > hitChance {
		result.Hit = false
		return result
	}
	
	result.Hit = true
	result.Critical = rand.Float64() < attacker.CriticalChance
	
	damage := pcr.CalculateDamage(attacker, defender, terrain)
	if result.Critical {
		damage = int(float64(damage) * 1.5)
	}
	
	damage += rand.Intn(5) - 2
	if damage < 1 {
		damage = 1
	}
	
	result.DefenderDamage = damage
	result.DefenderKilled = (defender.Health - damage) <= 0
	
	if defender.Health > damage && rand.Float64() < 0.7 {
		counterDamage := pcr.CalculateDamage(defender, attacker, TerrainModifiers{})
		counterDamage += rand.Intn(3) - 1
		if counterDamage < 1 {
			counterDamage = 1
		}
		
		result.AttackerDamage = counterDamage
		result.AttackerKilled = (attacker.Health - counterDamage) <= 0
	}
	
	return result
}

func (pcr *ProbabilisticCombatResolver) CalculateDamage(attackerStats, defenderStats CombatStats, terrain TerrainModifiers) int {
	baseAttack := float64(attackerStats.Attack - terrain.AttackPenalty)
	if baseAttack < 0 {
		baseAttack = 0
	}
	
	effectiveDefense := float64(defenderStats.Defense + terrain.DefenseBonus)
	
	damage := baseAttack * (100.0 / (100.0 + effectiveDefense))
	
	healthRatio := float64(attackerStats.Health) / float64(attackerStats.MaxHealth)
	damage *= healthRatio
	
	if damage < 1 {
		damage = 1
	}
	
	return int(damage)
}

func (pcr *ProbabilisticCombatResolver) CanAttack(attackerPos, defenderPos Position, attackRange int, board Board) bool {
	distance := board.GetDistance(attackerPos, defenderPos)
	return distance <= attackRange && distance >= 1
}

func (pcr *ProbabilisticCombatResolver) calculateHitChance(attacker, defender CombatStats, terrain TerrainModifiers) float64 {
	baseAccuracy := attacker.Accuracy + terrain.AccuracyBonus
	
	evasion := float64(defender.Defense) / 100.0
	if evasion > 0.5 {
		evasion = 0.5
	}
	
	hitChance := baseAccuracy - evasion
	if hitChance < 0.1 {
		hitChance = 0.1
	}
	if hitChance > 0.95 {
		hitChance = 0.95
	}
	
	return hitChance
}

type CombatManager struct {
	resolver CombatResolver
}

func NewCombatManager(resolver CombatResolver) *CombatManager {
	return &CombatManager{
		resolver: resolver,
	}
}

func (cm *CombatManager) SetResolver(resolver CombatResolver) {
	cm.resolver = resolver
}

func (cm *CombatManager) GetResolver() CombatResolver {
	return cm.resolver
}

func (cm *CombatManager) ResolveBattle(attackerEntity, defenderEntity *Entity, board Board) (CombatResult, error) {
	attackerStats, err := cm.extractCombatStats(attackerEntity)
	if err != nil {
		return CombatResult{}, fmt.Errorf("failed to extract attacker stats: %w", err)
	}
	
	defenderStats, err := cm.extractCombatStats(defenderEntity)
	if err != nil {
		return CombatResult{}, fmt.Errorf("failed to extract defender stats: %w", err)
	}
	
	attackerPos, err := cm.extractPosition(attackerEntity)
	if err != nil {
		return CombatResult{}, fmt.Errorf("failed to extract attacker position: %w", err)
	}
	
	defenderPos, err := cm.extractPosition(defenderEntity)
	if err != nil {
		return CombatResult{}, fmt.Errorf("failed to extract defender position: %w", err)
	}
	
	if !cm.resolver.CanAttack(attackerPos, defenderPos, attackerStats.AttackRange, board) {
		return CombatResult{}, fmt.Errorf("target out of range")
	}
	
	terrain := cm.getTerrainModifiers(board, defenderPos)
	
	result := cm.resolver.ResolveCombat(attackerStats, defenderStats, terrain)
	
	if err := cm.applyDamage(attackerEntity, result.AttackerDamage); err != nil {
		return result, fmt.Errorf("failed to apply attacker damage: %w", err)
	}
	
	if err := cm.applyDamage(defenderEntity, result.DefenderDamage); err != nil {
		return result, fmt.Errorf("failed to apply defender damage: %w", err)
	}
	
	return result, nil
}

func (cm *CombatManager) extractCombatStats(entity *Entity) (CombatStats, error) {
	stats := CombatStats{}
	
	if combat, exists := entity.GetComponent("combat"); exists {
		if attack, ok := combat["attack"].(float64); ok {
			stats.Attack = int(attack)
		}
		if defense, ok := combat["defense"].(float64); ok {
			stats.Defense = int(defense)
		}
		if attackRange, ok := combat["attackRange"].(float64); ok {
			stats.AttackRange = int(attackRange)
		}
		if accuracy, ok := combat["accuracy"].(float64); ok {
			stats.Accuracy = accuracy
		} else {
			stats.Accuracy = 0.85
		}
		if critChance, ok := combat["criticalChance"].(float64); ok {
			stats.CriticalChance = critChance
		}
	}
	
	if health, exists := entity.GetComponent("health"); exists {
		if current, ok := health["current"].(float64); ok {
			stats.Health = int(current)
		}
		if max, ok := health["max"].(float64); ok {
			stats.MaxHealth = int(max)
		}
	}
	
	return stats, nil
}

func (cm *CombatManager) extractPosition(entity *Entity) (Position, error) {
	return nil, fmt.Errorf("position extraction not implemented - needs game-specific position type")
}

func (cm *CombatManager) getTerrainModifiers(board Board, pos Position) TerrainModifiers {
	terrain, exists := board.GetTerrain(pos)
	if !exists {
		return TerrainModifiers{}
	}
	
	switch terrain {
	case "mountain":
		return TerrainModifiers{DefenseBonus: 30, CoverBonus: 20}
	case "forest":
		return TerrainModifiers{DefenseBonus: 15, CoverBonus: 10, AccuracyBonus: -0.1}
	case "city":
		return TerrainModifiers{DefenseBonus: 25, CoverBonus: 15}
	case "water":
		return TerrainModifiers{AttackPenalty: 10}
	default:
		return TerrainModifiers{}
	}
}

func (cm *CombatManager) applyDamage(entity *Entity, damage int) error {
	if damage <= 0 {
		return nil
	}
	
	health, exists := entity.GetComponent("health")
	if !exists {
		return fmt.Errorf("entity has no health component")
	}
	
	current, ok := health["current"].(float64)
	if !ok {
		return fmt.Errorf("invalid health current value")
	}
	
	newHealth := int(current) - damage
	if newHealth < 0 {
		newHealth = 0
	}
	
	health["current"] = float64(newHealth)
	entity.Components["health"] = health
	
	return nil
}