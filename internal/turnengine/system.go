package turnengine

import (
	"fmt"
	"sort"
)

type System interface {
	Name() string
	Priority() int
	Update(world *World) error
}

type SystemManager struct {
	systems []System
}

func NewSystemManager() *SystemManager {
	return &SystemManager{
		systems: make([]System, 0),
	}
}

func (sm *SystemManager) RegisterSystem(system System) {
	sm.systems = append(sm.systems, system)
	sort.Slice(sm.systems, func(i, j int) bool {
		return sm.systems[i].Priority() < sm.systems[j].Priority()
	})
}

func (sm *SystemManager) GetSystems() []System {
	return sm.systems
}

func (sm *SystemManager) Update(world *World) error {
	for _, system := range sm.systems {
		if err := system.Update(world); err != nil {
			return fmt.Errorf("system %s failed: %w", system.Name(), err)
		}
	}
	return nil
}

type World struct {
	EntityManager     *EntityManager
	ComponentRegistry *ComponentRegistry
	SystemManager     *SystemManager
}

func NewWorld() *World {
	return &World{
		EntityManager:     NewEntityManager(),
		ComponentRegistry: NewComponentRegistry(),
		SystemManager:     NewSystemManager(),
	}
}

func (w *World) RegisterSystem(system System) {
	w.SystemManager.RegisterSystem(system)
}

func (w *World) RegisterComponent(component Component) {
	w.ComponentRegistry.Register(component)
}

func (w *World) CreateEntity(id string) *Entity {
	return w.EntityManager.CreateEntity(id)
}

func (w *World) GetEntity(id string) (*Entity, bool) {
	return w.EntityManager.GetEntity(id)
}

func (w *World) RemoveEntity(id string) {
	w.EntityManager.RemoveEntity(id)
}

func (w *World) GetEntities() []*Entity {
	return w.EntityManager.GetEntities()
}

func (w *World) QueryEntities(componentTypes ...string) []*Entity {
	return w.EntityManager.QueryEntities(componentTypes...)
}

func (w *World) Update() error {
	return w.SystemManager.Update(w)
}

func (w *World) CreateComponent(componentType string, data map[string]interface{}) (Component, error) {
	return w.ComponentRegistry.CreateComponent(componentType, data)
}