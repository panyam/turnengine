module github.com/panyam/turnengine

go 1.24.0

require (
	connectrpc.com/connect v1.18.1
	github.com/alexedwards/scs/v2 v2.9.0
	github.com/chzyer/readline v1.5.1
	github.com/fatih/color v1.18.0
	github.com/felixge/httpsnoop v1.0.4
	github.com/grpc-ecosystem/grpc-gateway/v2 v2.22.0
	github.com/joho/godotenv v1.5.1
	github.com/panyam/goutils v0.1.10
	github.com/panyam/oneauth v0.0.12
	github.com/panyam/templar v0.0.21
	github.com/tdewolff/canvas v0.0.0-20250508181010-75987a1ae9cc
	golang.org/x/image v0.29.0
	golang.org/x/net v0.41.0
	golang.org/x/oauth2 v0.30.0
	google.golang.org/genproto/googleapis/api v0.0.0-20251029180050-ab9386a59fda
	google.golang.org/grpc v1.74.2
	google.golang.org/protobuf v1.36.10
)

require (
	cloud.google.com/go/compute/metadata v0.7.0 // indirect
	codeberg.org/go-latex/latex v0.1.0 // indirect
	codeberg.org/go-pdf/fpdf v0.11.1 // indirect
	github.com/BurntSushi/freetype-go v0.0.0-20160129220410-b763ddbfe298 // indirect
	github.com/BurntSushi/graphics-go v0.0.0-20160129215708-b43f31a4a966 // indirect
	github.com/BurntSushi/xgb v0.0.0-20210121224620-deaf085860bc // indirect
	github.com/BurntSushi/xgbutil v0.0.0-20190907113008-ad855c713046 // indirect
	github.com/ByteArena/poly2tri-go v0.0.0-20170716161910-d102ad91854f // indirect
	github.com/Kagami/go-avif v0.1.0 // indirect
	github.com/andybalholm/brotli v1.1.1 // indirect
	github.com/antchfx/htmlquery v1.3.4 // indirect
	github.com/antchfx/xpath v1.3.3 // indirect
	github.com/benoitkugler/textlayout v0.3.1 // indirect
	github.com/benoitkugler/textprocessing v0.0.3 // indirect
	github.com/fsnotify/fsnotify v1.9.0 // indirect
	github.com/go-fonts/latin-modern v0.3.3 // indirect
	github.com/go-text/typesetting v0.3.0 // indirect
	github.com/go-viper/mapstructure/v2 v2.4.0 // indirect
	github.com/golang-jwt/jwt/v5 v5.2.1 // indirect
	github.com/golang/freetype v0.0.0-20170609003504-e2365dfdc4a0 // indirect
	github.com/golang/groupcache v0.0.0-20210331224755-41bb18bfe9da // indirect
	github.com/gorilla/websocket v1.5.0 // indirect
	github.com/inconshreveable/mousetrap v1.1.0 // indirect
	github.com/kolesa-team/go-webp v1.0.5 // indirect
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/panyam/gocurrent v0.0.2 // indirect
	github.com/panyam/protoc-gen-go-wasmjs v0.0.25 // indirect
	github.com/panyam/servicekit v0.0.2 // indirect
	github.com/pelletier/go-toml/v2 v2.2.4 // indirect
	github.com/planetscale/vtprotobuf v0.6.1-0.20240319094008-0393e58bdf10 // indirect
	github.com/sagikazarmark/locafero v0.11.0 // indirect
	github.com/sourcegraph/conc v0.3.1-0.20240121214520-5f936abd7ae8 // indirect
	github.com/spf13/afero v1.15.0 // indirect
	github.com/spf13/cast v1.10.0 // indirect
	github.com/spf13/cobra v1.10.1 // indirect
	github.com/spf13/pflag v1.0.10 // indirect
	github.com/spf13/viper v1.21.0 // indirect
	github.com/srwiley/rasterx v0.0.0-20220730225603-2ab79fcdd4ef // indirect
	github.com/srwiley/scanx v0.0.0-20190309010443-e94503791388 // indirect
	github.com/subosito/gotenv v1.6.0 // indirect
	github.com/tdewolff/font v0.0.0-20250430140153-b654fd8acba3 // indirect
	github.com/tdewolff/minify/v2 v2.23.4 // indirect
	github.com/tdewolff/parse/v2 v2.8.0 // indirect
	github.com/wcharczuk/go-chart/v2 v2.1.2 // indirect
	go.yaml.in/yaml/v3 v3.0.4 // indirect
	golang.org/x/sys v0.33.0 // indirect
	golang.org/x/text v0.28.0 // indirect
	gonum.org/v1/plot v0.16.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20251014184007-4626949a642f // indirect
	modernc.org/knuth v0.5.5 // indirect
	modernc.org/token v1.1.0 // indirect
	star-tex.org/x/tex v0.7.1 // indirect
)

// replace github.com/panyam/protoc-gen-go-wasmjs v0.0.25 => ../protoc-gen-go-wasmjs/

replace github.com/panyam/templar v0.0.21 => ../templar

replace github.com/panyam/goutils v0.1.10 => ../goutils
