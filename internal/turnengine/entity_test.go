package turnengine

import (
	"testing"
)

type TestComponent struct {
	Value string `json:"value"`
}

func (tc TestComponent) Type() string { return "test" }

func TestEntityCreation(t *testing.T) {
	entity1 := NewEntity("")
	entity2 := NewEntity("")

	if entity1.ID == entity2.ID {
		t.Error("Entity IDs should be unique")
	}
	
	if entity1.ID == "" || entity2.ID == "" {
		t.Error("Entity IDs should not be empty")
	}
}

func TestEntityWithCustomID(t *testing.T) {
	entity := NewEntity("custom-id")
	
	if entity.ID != "custom-id" {
		t.Error("Entity should have custom ID")
	}
}

func TestComponentManagement(t *testing.T) {
	entity := NewEntity("test-entity")
	testComp := TestComponent{Value: "test-value"}

	entity.AddComponent(testComp)

	if !entity.HasComponent("test") {
		t.Error("Entity should have test component")
	}

	comp, exists := entity.GetComponent("test")
	if !exists {
		t.Error("Should be able to retrieve test component")
	}

	if comp["value"].(string) != "test-value" {
		t.Error("Component data should match")
	}
}

func TestComponentRemoval(t *testing.T) {
	entity := NewEntity("test-entity")
	testComp := TestComponent{Value: "test-value"}

	entity.AddComponent(testComp)
	
	if !entity.HasComponent("test") {
		t.Error("Entity should have test component")
	}

	entity.RemoveComponent("test")

	if entity.HasComponent("test") {
		t.Error("Entity should not have test component after removal")
	}
}

func TestHasComponents(t *testing.T) {
	entity := NewEntity("test-entity")
	testComp1 := TestComponent{Value: "test1"}
	
	entity.AddComponent(testComp1)
	
	if !entity.HasComponents("test") {
		t.Error("Entity should have test component")
	}
	
	if entity.HasComponents("test", "nonexistent") {
		t.Error("Entity should not have both test and nonexistent components")
	}
}

func TestEntityManager(t *testing.T) {
	em := NewEntityManager()
	
	entity := em.CreateEntity("")
	
	if entity == nil {
		t.Error("EntityManager should create entity")
	}
	
	retrieved, exists := em.GetEntity(entity.ID)
	if !exists {
		t.Error("Should be able to retrieve entity from manager")
	}
	
	if retrieved.ID != entity.ID {
		t.Error("Retrieved entity should match created entity")
	}
}

func TestEntityManagerQuery(t *testing.T) {
	em := NewEntityManager()
	
	entity1 := em.CreateEntity("")
	entity2 := em.CreateEntity("")
	em.CreateEntity("") // entity3 without testComp
	
	testComp := TestComponent{Value: "test"}
	entity1.AddComponent(testComp)
	entity2.AddComponent(testComp)
	// entity3 does not have testComp
	
	results := em.QueryEntities("test")
	
	if len(results) != 2 {
		t.Errorf("Expected 2 entities with test component, got %d", len(results))
	}
	
	// Check that the right entities were returned
	found1, found2 := false, false
	for _, e := range results {
		if e.ID == entity1.ID {
			found1 = true
		}
		if e.ID == entity2.ID {
			found2 = true
		}
	}
	
	if !found1 || !found2 {
		t.Error("Query should return entities 1 and 2")
	}
}
