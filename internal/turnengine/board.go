package turnengine

import (
	"fmt"
)

type Position struct {
	X, Y, Z int `json:"x,y,z"`
}

func (p Position) String() string {
	return fmt.Sprintf("(%d,%d,%d)", p.X, p.Y, p.Z)
}

func (p Position) Equals(other Position) bool {
	return p.X == other.X && p.Y == other.Y && p.Z == other.Z
}

type Board interface {
	GetWidth() int
	GetHeight() int
	IsValidPosition(pos Position) bool
	GetNeighbors(pos Position) []Position
	GetDistance(from, to Position) int
	FindPath(from, to Position, movementCost func(Position) int) ([]Position, error)
	GetTerrain(pos Position) (string, bool)
	SetTerrain(pos Position, terrainType string) error
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
	GetNeighbors(board Board, pos Position) []Position
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
	
	visited := make(map[Position]bool)
	visited[from] = true
	
	for len(queue) > 0 {
		current := queue[0]
		queue = queue[1:]
		
		neighbors := bm.board.GetNeighbors(current.pos)
		for _, neighbor := range neighbors {
			if visited[neighbor] || !bm.board.IsValidPosition(neighbor) {
				continue
			}
			
			newCost := current.cost + movementCost(neighbor)
			if newCost <= maxMovement {
				visited[neighbor] = true
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
	
	for x := from.X - sightRange; x <= from.X+sightRange; x++ {
		for y := from.Y - sightRange; y <= from.Y+sightRange; y++ {
			pos := Position{X: x, Y: y, Z: from.Z}
			if board.IsValidPosition(pos) && los.CanSee(board, from, pos, sightRange) {
				visible = append(visible, pos)
			}
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