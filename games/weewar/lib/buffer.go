package weewar

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/png"
	_ "image/png" // For PNG decoding
	"os"

	"github.com/tdewolff/canvas"
	"github.com/tdewolff/canvas/renderers"
	xdraw "golang.org/x/image/draw"
)

// DPI conversion constants
const (
	// PixelsPerMM represents the conversion factor from pixels to millimeters at 96 DPI
	// 96 DPI ÷ 25.4 mm/inch = 3.78 pixels/mm
	PixelsPerMM = 3.7795
)

// Buffer represents a drawable canvas with compositing capabilities
type Buffer struct {
	img    *image.RGBA
	width  int
	height int
}

// Point represents a 2D point
type Point struct {
	X, Y float64
}

// Color represents a color with alpha channel
type Color struct {
	R, G, B, A uint8
}

// StrokeProperties defines stroke rendering properties
type StrokeProperties struct {
	Width       float64
	LineCap     string // "butt", "round", "square"
	LineJoin    string // "miter", "round", "bevel"
	DashPattern []float64
	DashOffset  float64
}

// Coordinate Conversion Helpers
// =============================
// Buffer coordinates: (0,0) top-left, pixels
// Canvas coordinates: (0,0) bottom-left, millimeters

// bufferToCanvasX converts buffer X coordinate (pixels) to canvas X coordinate (mm)
func (b *Buffer) bufferToCanvasX(x float64) float64 {
	return x / PixelsPerMM
}

// bufferToCanvasY converts buffer Y coordinate (pixels) to canvas Y coordinate (mm)
// Note: Also flips Y-axis (buffer top-left to canvas bottom-left)
func (b *Buffer) bufferToCanvasY(y float64) float64 {
	return (float64(b.height) - y) / PixelsPerMM
}

// bufferToCanvasXY converts buffer coordinates (pixels) to canvas coordinates (mm)
func (b *Buffer) bufferToCanvasXY(x, y float64) (float64, float64) {
	return b.bufferToCanvasX(x), b.bufferToCanvasY(y)
}

// canvasToBufferX converts canvas X coordinate (mm) to buffer X coordinate (pixels)
func (b *Buffer) canvasToBufferX(x float64) float64 {
	return x * PixelsPerMM
}

// canvasToBufferY converts canvas Y coordinate (mm) to buffer Y coordinate (pixels)
// Note: Also flips Y-axis (canvas bottom-left to buffer top-left)
func (b *Buffer) canvasToBufferY(y float64) float64 {
	return float64(b.height) - (y * PixelsPerMM)
}

// canvasToBufferXY converts canvas coordinates (mm) to buffer coordinates (pixels)
func (b *Buffer) canvasToBufferXY(x, y float64) (float64, float64) {
	return b.canvasToBufferX(x), b.canvasToBufferY(y)
}

// getCanvasSize returns canvas dimensions in millimeters
func (b *Buffer) getCanvasSize() (width, height float64) {
	return float64(b.width) / PixelsPerMM, float64(b.height) / PixelsPerMM
}

// NewBuffer creates a new buffer with the specified dimensions
func NewBuffer(width, height int) *Buffer {
	return &Buffer{
		img:    image.NewRGBA(image.Rect(0, 0, width, height)),
		width:  width,
		height: height,
	}
}

// Clear clears the buffer (fills with transparent pixels)
func (b *Buffer) Clear() {
	draw.Draw(b.img, b.img.Bounds(), &image.Uniform{color.RGBA{0, 0, 0, 0}}, image.Point{}, draw.Src)
}

// Copy creates a deep copy of the buffer
func (b *Buffer) Copy() *Buffer {
	newBuffer := NewBuffer(b.width, b.height)
	draw.Draw(newBuffer.img, newBuffer.img.Bounds(), b.img, image.Point{}, draw.Src)
	return newBuffer
}

// Size returns the dimensions of the buffer
func (b *Buffer) Size() (width, height float64) {
	return float64(b.width), float64(b.height)
}

// DrawImage draws an image at the specified position with scaling and alpha compositing
func (b *Buffer) DrawImage(x, y, width, height float64, img image.Image) {
	// Calculate destination rectangle
	dstRect := image.Rect(int(x), int(y), int(x+width), int(y+height))

	// Clip to buffer bounds
	dstRect = dstRect.Intersect(b.img.Bounds())
	if dstRect.Empty() {
		return // Nothing to draw
	}

	// Get source bounds
	srcBounds := img.Bounds()

	// Use bilinear scaling for smooth results
	xdraw.BiLinear.Scale(b.img, dstRect, img, srcBounds, draw.Over, nil)
}

// RenderBuffer copies a source buffer onto this buffer with proper clipping
func (dest *Buffer) RenderBuffer(src *Buffer) {
	// Calculate intersection of source and destination
	srcBounds := src.img.Bounds()
	dstBounds := dest.img.Bounds()

	// Copy the source buffer onto the destination with alpha blending
	draw.Draw(dest.img, dstBounds, src.img, srcBounds.Min, draw.Over)
}

// Save saves the buffer to a PNG file
func (b *Buffer) Save(path string) error {
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()

	return png.Encode(file, b.img)
}

// ToDataURL converts the buffer to a base64 data URL for web use
func (b *Buffer) ToDataURL() (string, error) {
	var buf bytes.Buffer

	err := png.Encode(&buf, b.img)
	if err != nil {
		return "", err
	}

	encoded := base64.StdEncoding.EncodeToString(buf.Bytes())
	return "data:image/png;base64," + encoded, nil
}

// GetImageData returns the underlying image data for direct pixel access
func (b *Buffer) GetImageData() *image.RGBA {
	return b.img
}

// GetWidth returns the buffer width
func (b *Buffer) GetWidth() int {
	return b.width
}

// GetHeight returns the buffer height
func (b *Buffer) GetHeight() int {
	return b.height
}

// FillPath fills a given path with the given color (with alpha channel compositing)
func (b *Buffer) FillPath(points []Point, fillColor Color) {
	if len(points) < 2 {
		return // Need at least 2 points to create a path
	}

	// Create canvas with buffer dimensions in mm
	canvasWidth, canvasHeight := b.getCanvasSize()
	c := canvas.New(canvasWidth, canvasHeight)
	ctx := canvas.NewContext(c)

	// Set fill color
	rgba := color.RGBA{R: fillColor.R, G: fillColor.G, B: fillColor.B, A: fillColor.A}
	ctx.SetFillColor(rgba)

	// Build path using coordinate conversion helpers
	canvasX, canvasY := b.bufferToCanvasXY(points[0].X, points[0].Y)
	ctx.MoveTo(canvasX, canvasY)
	for i := 1; i < len(points); i++ {
		canvasX, canvasY := b.bufferToCanvasXY(points[i].X, points[i].Y)
		ctx.LineTo(canvasX, canvasY)
	}
	ctx.Close()

	// Fill the path
	ctx.Fill()

	// Render canvas to bytes buffer
	var buf bytes.Buffer
	err := c.Write(&buf, renderers.PNG(canvas.DPMM(PixelsPerMM)))
	if err != nil {
		return // Skip if rendering fails
	}

	// Decode the image from bytes
	tempImg, _, err := image.Decode(&buf)
	if err != nil {
		return
	}

	// Composite the temporary image onto the buffer
	draw.Draw(b.img, b.img.Bounds(), tempImg, image.Point{}, draw.Over)
}

// StrokePath strokes a given path with a given color and stroke properties
func (b *Buffer) StrokePath(points []Point, strokeColor Color, strokeProperties StrokeProperties) {
	if len(points) < 2 {
		return // Need at least 2 points to create a path
	}

	// Create canvas with buffer dimensions in mm
	canvasWidth, canvasHeight := b.getCanvasSize()
	c := canvas.New(canvasWidth, canvasHeight)
	ctx := canvas.NewContext(c)

	// Set stroke color
	rgba := color.RGBA{R: strokeColor.R, G: strokeColor.G, B: strokeColor.B, A: strokeColor.A}
	ctx.SetStrokeColor(rgba)

	// Set stroke width (convert pixels to mm)
	ctx.SetStrokeWidth(strokeProperties.Width / PixelsPerMM)

	// Set line cap
	switch strokeProperties.LineCap {
	case "round":
		ctx.SetStrokeCapper(canvas.RoundCapper{})
	case "square":
		ctx.SetStrokeCapper(canvas.SquareCapper{})
	default: // "butt" or unspecified
		ctx.SetStrokeCapper(canvas.ButtCapper{})
	}

	// Set line join
	switch strokeProperties.LineJoin {
	case "round":
		ctx.SetStrokeJoiner(canvas.RoundJoiner{})
	case "bevel":
		ctx.SetStrokeJoiner(canvas.BevelJoiner{})
	default: // "miter" or unspecified
		ctx.SetStrokeJoiner(canvas.MiterJoiner{})
	}

	// Set dash pattern if specified (convert pixels to mm)
	if len(strokeProperties.DashPattern) > 0 {
		scaledDashes := make([]float64, len(strokeProperties.DashPattern))
		for i, dash := range strokeProperties.DashPattern {
			scaledDashes[i] = dash / PixelsPerMM
		}
		ctx.SetDashes(strokeProperties.DashOffset/PixelsPerMM, scaledDashes...)
	}

	// Build path using coordinate conversion helpers
	canvasX, canvasY := b.bufferToCanvasXY(points[0].X, points[0].Y)
	ctx.MoveTo(canvasX, canvasY)
	for i := 1; i < len(points); i++ {
		canvasX, canvasY := b.bufferToCanvasXY(points[i].X, points[i].Y)
		ctx.LineTo(canvasX, canvasY)
	}

	// Stroke the path
	ctx.Stroke()

	// Render canvas to bytes buffer
	var buf bytes.Buffer
	err := c.Write(&buf, renderers.PNG(canvas.DPMM(PixelsPerMM)))
	if err != nil {
		return // Skip if rendering fails
	}

	// Decode the image from bytes
	tempImg, _, err := image.Decode(&buf)
	if err != nil {
		return
	}

	// Composite the temporary image onto the buffer
	draw.Draw(b.img, b.img.Bounds(), tempImg, image.Point{}, draw.Over)
}

// DrawText renders text at the specified position with the given font size and color
func (b *Buffer) DrawText(x, y float64, text string, fontSize float64, textColor Color) {
	b.DrawTextWithStyle(x, y, text, fontSize, textColor, false, Color{})
}

// DrawTextWithStyle renders text with optional bold and background
func (b *Buffer) DrawTextWithStyle(x, y float64, text string, fontSize float64, textColor Color, bold bool, backgroundColor Color) {
	if text == "" {
		return
	}

	// Create canvas with buffer dimensions in mm
	canvasWidth, canvasHeight := b.getCanvasSize()
	c := canvas.New(canvasWidth, canvasHeight)
	ctx := canvas.NewContext(c)

	// Load embedded font family (works in WASM)
	fontFamily := GetDefaultFontFamily()

	// Choose font weight
	fontWeight := canvas.FontRegular
	if true || bold {
		fontWeight = canvas.FontBold
	}

	// Set text color and create face
	rgba := color.RGBA{R: textColor.R, G: textColor.G, B: textColor.B, A: textColor.A}

	// Convert font size from pixels to mm
	face := fontFamily.Face(fontSize, rgba, fontWeight, canvas.FontNormal)

	// Set fill color on context to match text color
	ctx.SetFillColor(rgba)

	// Create text line for rendering
	textLine := canvas.NewTextLine(face, text, canvas.Left)

	// Get text bounds to position background properly
	bounds := textLine.Bounds()

	// Position background to properly contain text
	// Canvas DrawText positions text at baseline, estimate descender space
	textWidth := bounds.W()
	textHeight := bounds.H()

	// Convert buffer coordinates to canvas coordinates (once)
	canvasX, canvasY := b.bufferToCanvasXY(x, y)

	// Draw background rectangle if specified
	if false && backgroundColor.A > 0 {
		// Add padding around text (in mm)
		padding := 2.0 / PixelsPerMM // Convert 2 pixels to mm

		bgX := canvasX - padding
		bgY := canvasY - (textHeight * 0.2) - padding // Account for descenders below baseline
		bgWidth := textWidth + (padding * 2)
		bgHeight := textHeight + (padding * 2)

		ctx.SetFillColor(color.RGBA{R: backgroundColor.R, G: backgroundColor.G, B: backgroundColor.B, A: backgroundColor.A})
		ctx.DrawPath(bgX, bgY, canvas.Rectangle(bgWidth, bgHeight))
		ctx.Fill()
	}

	// Reset fill color to text color after drawing background
	// ctx.SetStrokeColor(rgba)
	// ctx.SetFillColor(rgba)

	// Draw the text using converted coordinates
	ctx.DrawText(canvasX-(textWidth/2), canvasY, textLine)
	// ctx.Fill()

	// Render canvas to bytes buffer
	var buf bytes.Buffer
	err := c.Write(&buf, renderers.PNG(canvas.DPMM(PixelsPerMM)))
	if err != nil {
		fmt.Println("error: ", err)
		return // Skip if rendering fails
	}

	// Decode the image from bytes
	tempImg, _, err := image.Decode(&buf)
	if err != nil {
		return
	}

	// Composite the temporary image onto the buffer
	draw.Draw(b.img, b.img.Bounds(), tempImg, image.Point{}, draw.Over)
}
