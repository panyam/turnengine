package turnengine

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
)

type Entity struct {
	ID         string                 `json:"id"`
	Components map[string]interface{} `json:"components"`
}

func generateID() string {
	bytes := make([]byte, 8)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

func NewEntity(id string) *Entity {
	if id == "" {
		id = generateID()
	}
	return &Entity{
		ID:         id,
		Components: make(map[string]interface{}),
	}
}

func (e *Entity) AddComponent(comp Component) {
	data, _ := json.Marshal(comp)
	var compData map[string]interface{}
	json.Unmarshal(data, &compData)
	e.Components[comp.Type()] = compData
}

func (e *Entity) GetComponent(compType string) (map[string]interface{}, bool) {
	comp, exists := e.Components[compType]
	if !exists {
		return nil, false
	}
	return comp.(map[string]interface{}), true
}

func (e *Entity) HasComponent(compType string) bool {
	_, exists := e.Components[compType]
	return exists
}

func (e *Entity) RemoveComponent(compType string) {
	delete(e.Components, compType)
}

func (e *Entity) HasComponents(compTypes ...string) bool {
	for _, compType := range compTypes {
		if !e.HasComponent(compType) {
			return false
		}
	}
	return true
}

type EntityManager struct {
	entities map[string]*Entity
}

func NewEntityManager() *EntityManager {
	return &EntityManager{
		entities: make(map[string]*Entity),
	}
}

func (em *EntityManager) CreateEntity(id string) *Entity {
	entity := NewEntity(id)
	em.entities[entity.ID] = entity
	return entity
}

func (em *EntityManager) GetEntity(id string) (*Entity, bool) {
	entity, exists := em.entities[id]
	return entity, exists
}

func (em *EntityManager) RemoveEntity(id string) {
	delete(em.entities, id)
}

func (em *EntityManager) GetEntities() []*Entity {
	entities := make([]*Entity, 0, len(em.entities))
	for _, entity := range em.entities {
		entities = append(entities, entity)
	}
	return entities
}

func (em *EntityManager) QueryEntities(componentTypes ...string) []*Entity {
	var result []*Entity
	for _, entity := range em.entities {
		if entity.HasComponents(componentTypes...) {
			result = append(result, entity)
		}
	}
	return result
}
