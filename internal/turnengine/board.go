package turnengine

import (
	"fmt"
)

type Position interface {
	String() string
	Equals(Position) bool
	Hash() string
}

type Board interface {
	IsValidPosition(pos Position) bool
	GetNeighbors(pos Position) []Position
	GetDistance(from, to Position) int
	GetTerrain(pos Position) (string, bool)
	SetTerrain(pos Position, terrainType string) error
	GetAllPositions() []Position
}

type PathfindingNode struct {
	Position Position
	GCost    int
	HCost    int
	FCost    int
	Parent   *PathfindingNode
}

func (n *PathfindingNode) CalculateFCost() {
	n.FCost = n.GCost + n.HCost
}

type Pathfinder interface {
	FindPath(board Board, from, to Position, movementCost func(Position) int) ([]Position, error)
	CalculateDistance(from, to Position) int
}

type BoardManager struct {
	board      Board
	pathfinder Pathfinder
}

func NewBoardManager(board Board, pathfinder Pathfinder) *BoardManager {
	return &BoardManager{
		board:      board,
		pathfinder: pathfinder,
	}
}

func (bm *BoardManager) GetBoard() Board {
	return bm.board
}

func (bm *BoardManager) SetBoard(board Board) {
	bm.board = board
}

func (bm *BoardManager) GetPathfinder() Pathfinder {
	return bm.pathfinder
}

func (bm *BoardManager) SetPathfinder(pathfinder Pathfinder) {
	bm.pathfinder = pathfinder
}

func (bm *BoardManager) FindPath(from, to Position, movementCost func(Position) int) ([]Position, error) {
	if bm.pathfinder == nil {
		return nil, fmt.Errorf("no pathfinder set")
	}
	return bm.pathfinder.FindPath(bm.board, from, to, movementCost)
}

func (bm *BoardManager) IsValidMove(from, to Position, maxMovement int, movementCost func(Position) int) bool {
	if !bm.board.IsValidPosition(to) {
		return false
	}
	
	path, err := bm.FindPath(from, to, movementCost)
	if err != nil {
		return false
	}
	
	totalCost := 0
	for i := 1; i < len(path); i++ {
		totalCost += movementCost(path[i])
		if totalCost > maxMovement {
			return false
		}
	}
	
	return true
}

func (bm *BoardManager) GetMovementRange(from Position, maxMovement int, movementCost func(Position) int) []Position {
	var reachable []Position
	
	queue := []struct {
		pos  Position
		cost int
	}{{from, 0}}
	
	visited := make(map[string]bool)
	visited[from.Hash()] = true
	
	for len(queue) > 0 {
		current := queue[0]
		queue = queue[1:]
		
		neighbors := bm.board.GetNeighbors(current.pos)
		for _, neighbor := range neighbors {
			hash := neighbor.Hash()
			if visited[hash] || !bm.board.IsValidPosition(neighbor) {
				continue
			}
			
			newCost := current.cost + movementCost(neighbor)
			if newCost <= maxMovement {
				visited[hash] = true
				reachable = append(reachable, neighbor)
				queue = append(queue, struct {
					pos  Position
					cost int
				}{neighbor, newCost})
			}
		}
	}
	
	return reachable
}

type LineOfSight interface {
	CanSee(board Board, from, to Position, sightRange int) bool
	GetVisiblePositions(board Board, from Position, sightRange int) []Position
	IsBlocked(board Board, pos Position) bool
}

type BasicLineOfSight struct{}

func (los *BasicLineOfSight) CanSee(board Board, from, to Position, sightRange int) bool {
	distance := board.GetDistance(from, to)
	if distance > sightRange {
		return false
	}
	
	return !los.IsBlocked(board, to)
}

func (los *BasicLineOfSight) GetVisiblePositions(board Board, from Position, sightRange int) []Position {
	var visible []Position
	
	allPositions := board.GetAllPositions()
	for _, pos := range allPositions {
		if los.CanSee(board, from, pos, sightRange) {
			visible = append(visible, pos)
		}
	}
	
	return visible
}

func (los *BasicLineOfSight) IsBlocked(board Board, pos Position) bool {
	terrain, exists := board.GetTerrain(pos)
	if !exists {
		return false
	}
	
	blockingTerrain := []string{"mountain", "forest", "wall"}
	for _, blocking := range blockingTerrain {
		if terrain == blocking {
			return true
		}
	}
	
	return false
}

type AStarPathfinder struct{}

func (pf *AStarPathfinder) FindPath(board Board, from, to Position, movementCost func(Position) int) ([]Position, error) {
	if !board.IsValidPosition(from) || !board.IsValidPosition(to) {
		return nil, fmt.Errorf("invalid start or end position")
	}
	
	if from.Equals(to) {
		return []Position{from}, nil
	}
	
	openSet := []*PathfindingNode{}
	closedSet := make(map[string]*PathfindingNode)
	
	startNode := &PathfindingNode{
		Position: from,
		GCost:    0,
		HCost:    pf.CalculateDistance(from, to),
	}
	startNode.CalculateFCost()
	
	openSet = append(openSet, startNode)
	
	for len(openSet) > 0 {
		currentNode := openSet[0]
		currentIndex := 0
		
		for i, node := range openSet {
			if node.FCost < currentNode.FCost || (node.FCost == currentNode.FCost && node.HCost < currentNode.HCost) {
				currentNode = node
				currentIndex = i
			}
		}
		
		openSet = append(openSet[:currentIndex], openSet[currentIndex+1:]...)
		closedSet[currentNode.Position.Hash()] = currentNode
		
		if currentNode.Position.Equals(to) {
			return pf.reconstructPath(currentNode), nil
		}
		
		neighbors := board.GetNeighbors(currentNode.Position)
		for _, neighbor := range neighbors {
			if !board.IsValidPosition(neighbor) {
				continue
			}
			
			hash := neighbor.Hash()
			if _, inClosed := closedSet[hash]; inClosed {
				continue
			}
			
			newGCost := currentNode.GCost + movementCost(neighbor)
			
			var neighborNode *PathfindingNode
			inOpen := false
			for _, node := range openSet {
				if node.Position.Equals(neighbor) {
					neighborNode = node
					inOpen = true
					break
				}
			}
			
			if !inOpen || newGCost < neighborNode.GCost {
				if neighborNode == nil {
					neighborNode = &PathfindingNode{Position: neighbor}
					openSet = append(openSet, neighborNode)
				}
				
				neighborNode.GCost = newGCost
				neighborNode.HCost = pf.CalculateDistance(neighbor, to)
				neighborNode.Parent = currentNode
				neighborNode.CalculateFCost()
			}
		}
	}
	
	return nil, fmt.Errorf("no path found")
}

func (pf *AStarPathfinder) CalculateDistance(from, to Position) int {
	return 1
}

func (pf *AStarPathfinder) reconstructPath(node *PathfindingNode) []Position {
	var path []Position
	current := node
	
	for current != nil {
		path = append([]Position{current.Position}, path...)
		current = current.Parent
	}
	
	return path
}