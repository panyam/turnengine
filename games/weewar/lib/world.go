package weewar

import (
	"encoding/json"
	"fmt"
	"iter"
	"maps"
	"math"
	"slices"
)

// =============================================================================
// World - Pure Game State Container
// =============================================================================

type WorldBounds struct {
	MinX, MinY, MaxX, MaxY float64
	MinQ, MinR, MaxQ, MaxR int
	MinXCoord, MinYCoord   AxialCoord
	MaxXCoord, MaxYCoord   AxialCoord
	StartingCoord          AxialCoord
	StartingX              float64
}

// World represents the pure game state without any rendering or UI concerns.
// This is the single source of truth for all game data.
type World struct {
	// JSON-friendly representation
	Name string
	// PlayerCount int `json:"playerCount"` // Number of players in the game

	// Ways to identify various kinds of units and tiles
	unitsByPlayer [][]*Unit            `json:"-"` // All units in the game world by player ID
	unitsByCoord  map[AxialCoord]*Unit `json:"-"` // All units in the game world by player ID
	tilesByCoord  map[AxialCoord]*Tile `json:"-"` // Direct cube coordinate lookup (custom JSON handling)

	// Coordinate bounds - These can be evaluated.
	minQ int `json:"-"` // Minimum Q coordinate (inclusive)
	maxQ int `json:"-"` // Maximum Q coordinate (inclusive)
	minR int `json:"-"` // Minimum R coordinate (inclusive)
	maxR int `json:"-"` // Maximum R coordinate (inclusive)

	boundsChanged   bool
	lastWorldBounds WorldBounds

	// Observer pattern for state changes
	WorldSubject `json:"-"`
}

// Note: Position type is already defined in game_interface.go

// =============================================================================
// World Creation and Management
// =============================================================================

// NewWorld creates a new game world with the specified parameters
func NewWorld(name string) *World {
	w := &World{
		Name:         name,
		tilesByCoord: map[AxialCoord]*Tile{},
		unitsByCoord: map[AxialCoord]*Unit{},
	}

	return w
}

// =============================================================================
// World State Access Methods
// =============================================================================

func (w *World) PlayerCount() int {
	return len(w.unitsByPlayer)
}

func (w *World) TilesByCoord() iter.Seq2[AxialCoord, *Tile] {
	return func(yield func(AxialCoord, *Tile) bool) {
		for k, v := range w.tilesByCoord {
			if !yield(k, v) {
				return
			}
		}
	}
}

func (w *World) UnitsByCoord(coord AxialCoord) iter.Seq2[AxialCoord, *Unit] {
	return func(yield func(AxialCoord, *Unit) bool) {
		for k, v := range w.unitsByCoord {
			if !yield(k, v) {
				return
			}
		}
	}
}

// Getize returns the dimensions of the world map
func (w *World) UnitAt(coord AxialCoord) *Unit {
	return w.unitsByCoord[coord]
}

// TileAt returns the tile at the specified cube coordinates
func (w *World) TileAt(coord AxialCoord) *Tile {
	return w.tilesByCoord[coord]
}

// GetPlayerUnits returns all units belonging to the specified player
func (w *World) GetPlayerUnits(playerID int) []*Unit {
	return w.unitsByPlayer[playerID]
}

// =============================================================================
// World State Mutation Methods
// =============================================================================

// SetTileTypeCube changes the terrain type at the specified cube coordinates
func (w *World) SetTileType(coord AxialCoord, terrainType int) bool {
	// Get or create tile at position
	tile := w.TileAt(coord)
	if tile == nil {
		// Create new tile
		tile = NewTile(coord, terrainType)
		w.AddTile(tile)
	} else {
		// Update existing tile
		tile.TileType = terrainType
	}

	return true
}

// AddTileCube adds a tile at the specified cube coordinate (primary method)
func (w *World) AddTile(tile *Tile) {
	q, r := tile.Coord.Q, tile.Coord.R
	if q < w.minQ || q > w.maxQ || r < w.minR || r > w.maxR {
		w.boundsChanged = true
	}
	w.tilesByCoord[tile.Coord] = tile
}

// DeleteTile removes the tile at the specified cube coordinate
func (w *World) DeleteTile(coord AxialCoord) {
	delete(w.tilesByCoord, coord)
}

// AddUnit adds a new unit to the world at the specified position
func (w *World) AddUnit(unit *Unit) (oldunit *Unit, err error) {
	if unit == nil {
		return nil, fmt.Errorf("unit is nil")
	}

	playerID := unit.Player
	if playerID < 0 {
		return nil, fmt.Errorf("invalid player ID: %d", playerID)
	}
	for playerID >= len(w.unitsByPlayer) {
		w.unitsByPlayer = append(w.unitsByPlayer, nil)
	}

	oldunit = w.UnitAt(unit.Coord)

	// make sure to replace a unit here
	w.unitsByPlayer[unit.Player] = append(w.unitsByPlayer[unit.Player], unit)
	w.unitsByCoord[unit.Coord] = unit
	return
}

// RemoveUnit removes a unit from the world
func (w *World) RemoveUnit(unit *Unit) error {
	if unit == nil {
		return fmt.Errorf("unit is nil")
	}

	tile := w.TileAt(unit.Coord)
	if tile == nil {
		return fmt.Errorf("invalid tile")
	}
	p := unit.Player
	delete(w.unitsByCoord, unit.Coord)
	for i, u := range w.unitsByPlayer[p] {
		if u == unit {
			// Remove unit from slice
			w.unitsByPlayer[p] = append(w.unitsByPlayer[p][:i], w.unitsByPlayer[p][i+1:]...)
			break
		}
	}
	return nil
}

// MoveUnit moves a unit to a new position
func (w *World) MoveUnit(unit *Unit, newCoord AxialCoord) error {
	if unit == nil {
		return fmt.Errorf("unit is nil")
	}

	// Remove from old position
	delete(w.unitsByCoord, unit.Coord)

	// Update unit position
	unit.Coord = newCoord

	// Add to new position
	w.unitsByCoord[newCoord] = unit

	return nil
}

// =============================================================================
// World Validation and Utilities
// =============================================================================

// Clone creates a deep copy of the world state (useful for undo/redo systems)
func (w *World) Clone() *World {
	if w == nil {
		return nil
	}

	out := NewWorld(w.Name)
	// Clone map
	for _, tile := range w.tilesByCoord {
		if tile != nil {
			out.AddTile(tile.Clone())
		}
	}
	for _, unit := range w.unitsByCoord {
		if unit != nil {
			out.AddUnit(unit.Clone())
		}
	}
	return out
}

// =============================================================================
// World Loading Methods
// =============================================================================

// GetAllTiles returns all tiles as a map from cube coordinates to tiles
func (w *World) CopyAllTiles() map[AxialCoord]*Tile {
	// Return a copy to prevent external modification
	result := make(map[AxialCoord]*Tile)
	for coord, tile := range w.tilesByCoord {
		result[coord] = tile
	}
	return result
}

/*
// ViewState represents UI-specific state that doesn't affect game logic.
// This includes visual concerns like selections, highlights, and camera position.
type ViewState struct {
	// Selection and highlighting
	SelectedUnit    *Unit      `json:"selectedUnit"`    // Currently selected unit
	HoveredTile     *Tile      `json:"hoveredTile"`     // Tile under cursor
	MovableTiles    []Position `json:"movableTiles"`    // Highlighted movement tiles
	AttackableTiles []Position `json:"attackableTiles"` // Highlighted attack tiles

	// Visual settings
	ShowGrid        bool `json:"showGrid"`        // Whether to show hex grid lines
	ShowCoordinates bool `json:"showCoordinates"` // Whether to show coordinate labels
	ShowPaths       bool `json:"showPaths"`       // Whether to show movement paths

	// Camera and viewport
	CameraX   float64 `json:"cameraX"`   // Camera X position
	CameraY   float64 `json:"cameraY"`   // Camera Y position
	ZoomLevel float64 `json:"zoomLevel"` // Zoom level (1.0 = normal)

	// Editor-specific state
	BrushTerrain int `json:"brushTerrain"` // Current terrain type for painting
	BrushSize    int `json:"brushSize"`    // Brush radius (0 = single hex)
}

// NewViewState creates a new view state with default settings
func NewViewState() *ViewState {
	return &ViewState{
		SelectedUnit:    nil,
		HoveredTile:     nil,
		MovableTiles:    make([]Position, 0),
		AttackableTiles: make([]Position, 0),
		ShowGrid:        true,
		ShowCoordinates: false,
		ShowPaths:       true,
		CameraX:         0.0,
		CameraY:         0.0,
		ZoomLevel:       1.0,
		BrushTerrain:    1, // Default to grass
		BrushSize:       0, // Single hex brush
	}
}
*/

// =============================================================================
// JSON Serialization Methods
// =============================================================================

// MarshalJSON implements custom JSON marshaling for World
func (w *World) MarshalJSON() ([]byte, error) {
	// Convert cube map to tile list for JSON
	out := map[string]any{
		"Name":  w.Name,
		"Tiles": slices.Collect(maps.Values(w.tilesByCoord)),
		"Units": slices.Collect(maps.Values(w.unitsByCoord)),
	}
	return json.Marshal(out)
}

// UnmarshalJSON implements custom JSON unmarshaling for privateMap
func (w *World) UnmarshalJSON(data []byte) error {
	// First try to unmarshal with new bounds format
	type mapJSON struct {
		Name  string
		Tiles []*Tile
		Units []*Unit
	}

	var dict mapJSON

	if err := json.Unmarshal(data, &dict); err != nil {
		return err
	}

	w.Name = dict.Name
	// w.PlayerCount = dict.PlayerCount
	for _, tile := range dict.Tiles {
		w.AddTile(tile)
	}

	for _, unit := range dict.Units {
		w.AddUnit(unit)
	}
	w.boundsChanged = true
	return nil
}

// =============================================================================
// ViewState Management
// =============================================================================

// ClearSelection clears the current unit selection and highlights
func (vs *ViewState) ClearSelection() {
	vs.SelectedUnit = nil
	vs.MovableTiles = make([]Position, 0)
	vs.AttackableTiles = make([]Position, 0)
}

// SetSelection sets the selected unit and updates related highlights
func (vs *ViewState) SetSelection(unit *Unit, movableTiles, attackableTiles []Position) {
	vs.SelectedUnit = unit
	vs.MovableTiles = movableTiles
	vs.AttackableTiles = attackableTiles
}

// SetCamera updates the camera position and zoom
func (vs *ViewState) SetCamera(x, y, zoom float64) {
	vs.CameraX = x
	vs.CameraY = y
	vs.ZoomLevel = zoom
}

// SetBrush updates the brush settings for terrain editing
func (vs *ViewState) SetBrush(terrainType, brushSize int) {
	vs.BrushTerrain = terrainType
	vs.BrushSize = brushSize
}

// ViewState represents UI-specific state that doesn't affect game logic.
// This includes visual concerns like selections, highlights, and camera position.
type ViewState struct {
	// Selection and highlighting
	SelectedUnit    *Unit      `json:"selectedUnit"`    // Currently selected unit
	HoveredTile     *Tile      `json:"hoveredTile"`     // Tile under cursor
	MovableTiles    []Position `json:"movableTiles"`    // Highlighted movement tiles
	AttackableTiles []Position `json:"attackableTiles"` // Highlighted attack tiles

	// Visual settings
	ShowGrid        bool `json:"showGrid"`        // Whether to show hex grid lines
	ShowCoordinates bool `json:"showCoordinates"` // Whether to show coordinate labels
	ShowPaths       bool `json:"showPaths"`       // Whether to show movement paths

	// Camera and viewport
	CameraX   float64 `json:"cameraX"`   // Camera X position
	CameraY   float64 `json:"cameraY"`   // Camera Y position
	ZoomLevel float64 `json:"zoomLevel"` // Zoom level (1.0 = normal)

	// Editor-specific state
	BrushTerrain int `json:"brushTerrain"` // Current terrain type for painting
	BrushSize    int `json:"brushSize"`    // Brush radius (0 = single hex)
}

// NewViewState creates a new view state with default settings
func NewViewState() *ViewState {
	return &ViewState{
		SelectedUnit:    nil,
		HoveredTile:     nil,
		MovableTiles:    make([]Position, 0),
		AttackableTiles: make([]Position, 0),
		ShowGrid:        true,
		ShowCoordinates: false,
		ShowPaths:       true,
		CameraX:         0.0,
		CameraY:         0.0,
		ZoomLevel:       1.0,
		BrushTerrain:    1, // Default to grass
		BrushSize:       0, // Single hex brush
	}
}

// CenterXYForTile converts cube coordinates directly to pixel center x,y coordinates for rendering
// Uses odd-r layout (odd rows offset) as our fixed, consistent layout
// Based on formulas from redblobgames.com for pointy-topped hexagons
func (m *World) CenterXYForTile(coord AxialCoord, tileWidth, tileHeight, yIncrement float64) (x, y float64) {
	// Direct cube coordinate to pixel conversion using proper hex math
	if false {
		q := float64(coord.Q)
		r := float64(coord.R)

		// For pointy-topped hexagons with odd-r layout:
		// x = size * sqrt(3) * (q + r/2)
		// y = size * 3/2 * r
		size := tileWidth / SQRT3

		// Convert normalized origin to pixel coordinates
		// Note: Both OriginX and OriginY are in tile width units for consistency with hex geometry

		// tileWidth = size * SQRT3
		x = tileWidth * (q + r/2.0) // 1.732050808 ≈ sqrt(3)
		y = size * 1.5 * r
	} else {
		row, col := HexToRowCol(coord)
		// fmt.Printf("HexToRow, QR: %s, RowCol: (%d, %d)\n", coord, row, col)
		y = yIncrement * float64(row)  // + (tileHeight / 2)
		x = tileWidth * (float64(col)) //  + 0.5)
		if (row & 1) == 1 {
			x += tileWidth / 2
		}

		// x = tileWidth * (float64(col) + 0.5*float64(row&1))
	}

	return x, y
}

// XYToQR converts screen coordinates to cube coordinates for the map
// Given x,y screen coordinates and tile size properties, returns the AxialCoord
// Uses the privateMap's normalized OriginX/OriginY for proper coordinate translation
// Based on formulas from redblobgames.com for pointy-topped hexagons with odd-r layout
func (m *World) XYToQR(x, y, tileWidth, tileHeight, yIncrement float64) (coord AxialCoord) {
	if false {
		// Convert normalized origin to pixel coordinates
		// Note: Both OriginX and OriginY are in tile width units for consistency with hex geometry
		originPixelX := 0.0 // m.OriginX * tileWidth
		originPixelY := 0.0 // m.OriginY * tilHeight

		// Translate screen coordinates to hex coordinate space by removing origin offset
		hexX := x - originPixelX
		hexY := y - originPixelY

		// For pointy-topped hexagons, convert pixel coordinates to fractional hex coordinates
		// Using inverse of the hex-to-pixel conversion formulas:
		// x = size * sqrt(3) * (q + r/2)  =>  q = (sqrt(3) * x) / (y * 3)
		// y = size * 3/2 * r             =>  r = (y * 2.0 / 3.0)
		size := tileWidth / SQRT3

		// Calculate fractional q coordinate
		fractionalQ := (hexX*SQRT3 - y) / (size * 3.0)

		// Calculate fractional r coordinate
		fractionalR := (hexY * 2.0) / (3.0 * size)

		// Round to nearest integer coordinates using cube coordinate rounding
		// This ensures we get the correct hex tile even for coordinates near boundaries
		coord = roundAxialCoord(fractionalQ, fractionalR)

		fmt.Println("X,Y: ", x, y)
		fmt.Println("FQ, FR, FQ+FR: ", fractionalQ, fractionalR, fractionalQ+fractionalR)
	} else { // given we can have non "equal" side length hexagons, easier to do this by converting to row/col first
		row := int((y + tileHeight/2) / yIncrement)

		halfDists := int(1 + math.Abs(x*2/tileWidth))
		if (row & 1) != 0 {
			halfDists = int(1 + math.Abs((x-tileWidth/2)*2/tileWidth))
		}
		// log.Println("Half Dists: ", halfDists)
		col := halfDists / 2
		if x < 0 {
			col = -col
		}
		// col := int((x + tileWidth/2) / tileWidth)
		coord = RowColToHex(row, col)
		// fmt.Println("X,Y: ", x, y)
		// fmt.Println("Row, Col: ", row, col)
	}
	// fmt.Println("Final Coord: ", coord)
	// fmt.Println("======")
	return
}

// roundAxialCoord rounds fractional cube coordinates to the nearest integer cube coordinate
// Uses the cube coordinate constraint (q + r + s = 0) to ensure valid hex coordinates
// Reference: https://www.redblobgames.com/grids/hexagons-v1/#rounding
func roundAxialCoord(fractionalQ, fractionalR float64) AxialCoord {
	// Calculate s from the cube coordinate constraint: s = -q - r
	fractionalS := -fractionalQ - fractionalR

	// Round each coordinate to nearest integer
	roundedQ := int(fractionalQ + 0.5)
	roundedR := int(fractionalR + 0.5)
	roundedS := int(fractionalS + 0.5)

	// Calculate rounding deltas
	deltaQ := math.Abs(float64(roundedQ) - fractionalQ)
	deltaR := math.Abs(float64(roundedR) - fractionalR)
	deltaS := math.Abs(float64(roundedS) - fractionalS)

	// Fix the coordinate with the largest rounding error to maintain constraint
	if deltaQ > deltaR && deltaQ > deltaS {
		roundedQ = -roundedR - roundedS
	} else if deltaR > deltaS {
		roundedR = -roundedQ - roundedS
	} else {
		roundedS = -roundedQ - roundedR
	}

	// Return the rounded cube coordinate (s is implicit)
	return AxialCoord{Q: roundedQ, R: roundedR}
}

// getprivateMapBounds calculates the pixel bounds of the entire map
// TODO - cache this and only update when bounds changed beyond min/max Q/R
func (m *World) GetWorldBounds(tileWidth, tileHeight, yIncrement float64) WorldBounds {
	if true || !m.boundsChanged {
		// TODO - return last avlues
		// m.boundsChanged = false
		minX := math.Inf(1)
		minY := math.Inf(1)
		maxX := math.Inf(-1)
		maxY := math.Inf(-1)
		minQ := int(math.Inf(1))
		minR := int(math.Inf(1))
		maxQ := int(math.Inf(-1))
		maxR := int(math.Inf(-1))
		startingX := 0.0
		var minXCoord, minYCoord, maxXCoord, maxYCoord, startingCoord AxialCoord

		for coord := range m.tilesByCoord {
			// Use origin at (0,0) for bounds calculation
			x, y := m.CenterXYForTile(coord, tileWidth, tileHeight, yIncrement)
			// fmt.Printf("Tile Coords: QR: %s, XY: (%f, %f)\n", coord, x, y)

			if coord.Q < minQ {
				minQ = coord.Q
			}
			if coord.Q > maxQ {
				maxQ = coord.Q
			}
			if coord.R < minR {
				minR = coord.R
			}
			if coord.R > maxR {
				maxR = coord.R
			}
			if x < minX {
				minX = x
				minXCoord = coord
			}
			if y < minY {
				minY = y
				minYCoord = coord
			}
			if x+tileWidth > maxX {
				maxX = x + tileWidth
				maxXCoord = coord
			}
			if y+tileHeight > maxY {
				maxY = y + tileHeight
				maxYCoord = coord
			}
		}

		// Now that we have minY and minX coords, we can findout starting by walking "left" from minYCoord and "up" from
		// minXcoord and see where they meet
		// NOTE - the rows "decrease" as we go up vertically
		minYRow := minYCoord.R // S coord is same in a row for pointy-top hexes
		minXRow := minXCoord.R // S coord is same in a row for pointy-top hexes

		// if minx == miny or both minXCoord and minYCoord are in the same row then easy
		startingCoord = minXCoord
		startingX = minX

		if minXCoord != minYCoord || minXRow != minYRow {
			// The hard case
			if minXRow < minYRow {
				// because X should be "below" Y so it should have a higher row number than minYCoord
				panic(fmt.Sprintf("minXRow (%d, %f) cannot be less than minYRow (%d, %f)??", minXRow, minX, minYRow, minY))
			}
			startingCoord = minXCoord
			for i := minXRow; i >= minYRow; i-- {
				if (i & 1) == 0 {
					// Always take the "Right" path first so we are guaranteed
					// to always be on a tile whose X Coordinate is >= minX
					startingCoord = startingCoord.Neighbor(TOP_RIGHT)
				} else {
					startingCoord = startingCoord.Neighbor(TOP_LEFT)
				}
			}
		}

		// If distance was odd then we would have a half tile width shift to the right
		if ((minXRow - minYRow) & 1) == 0 {
			startingX += tileWidth / 2.0
		}
		// startingX, _ = m.CenterXYForTile(startingCoord, tileWidth, tileHeight, yIncrement)
		// fmt.Printf("StartingX, StartingCoord: ", startingX, startingCoord)

		m.lastWorldBounds.MinX = minX
		m.lastWorldBounds.MinY = minY
		m.lastWorldBounds.MaxX = maxX
		m.lastWorldBounds.MaxY = maxY
		m.lastWorldBounds.MinQ = minQ
		m.lastWorldBounds.MinR = minR
		m.lastWorldBounds.MaxQ = maxQ
		m.lastWorldBounds.MaxR = maxR
		m.lastWorldBounds.StartingX = startingX
		m.lastWorldBounds.MinXCoord = minXCoord
		m.lastWorldBounds.MinYCoord = minYCoord
		m.lastWorldBounds.MaxXCoord = maxXCoord
		m.lastWorldBounds.MaxYCoord = maxYCoord
		m.lastWorldBounds.StartingCoord = startingCoord
	}
	return m.lastWorldBounds
}
