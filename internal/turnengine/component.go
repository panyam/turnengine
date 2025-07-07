package turnengine

import (
	"encoding/json"
	"fmt"
	"reflect"
)

type Component interface {
	Type() string
}

type ComponentRegistry struct {
	types map[string]reflect.Type
}

func NewComponentRegistry() *ComponentRegistry {
	return &ComponentRegistry{
		types: make(map[string]reflect.Type),
	}
}

func (cr *ComponentRegistry) Register(component Component) {
	componentType := component.Type()
	cr.types[componentType] = reflect.TypeOf(component)
}

func (cr *ComponentRegistry) CreateComponent(componentType string, data map[string]interface{}) (Component, error) {
	reflectType, exists := cr.types[componentType]
	if !exists {
		return nil, fmt.Errorf("unknown component type: %s", componentType)
	}
	
	instance := reflect.New(reflectType).Interface()
	
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal component data: %w", err)
	}
	
	if err := json.Unmarshal(jsonData, instance); err != nil {
		return nil, fmt.Errorf("failed to unmarshal component data: %w", err)
	}
	
	component, ok := instance.(Component)
	if !ok {
		return nil, fmt.Errorf("component does not implement Component interface")
	}
	
	return component, nil
}
