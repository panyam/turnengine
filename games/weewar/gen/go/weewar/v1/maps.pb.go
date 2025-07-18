// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.36.6
// 	protoc        (unknown)
// source: weewar/v1/maps.proto

package v1

import (
	_ "github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-openapiv2/options"
	_ "google.golang.org/genproto/googleapis/api/annotations"
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
	fieldmaskpb "google.golang.org/protobuf/types/known/fieldmaskpb"
	reflect "reflect"
	sync "sync"
	unsafe "unsafe"
)

const (
	// Verify that this generated code is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(20 - protoimpl.MinVersion)
	// Verify that runtime/protoimpl is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(protoimpl.MaxVersion - 20)
)

// MapInfo represents a map in the catalog
type MapInfo struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Id            string                 `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	Name          string                 `protobuf:"bytes,2,opt,name=name,proto3" json:"name,omitempty"`
	Description   string                 `protobuf:"bytes,3,opt,name=description,proto3" json:"description,omitempty"`
	Category      string                 `protobuf:"bytes,4,opt,name=category,proto3" json:"category,omitempty"`
	Difficulty    string                 `protobuf:"bytes,5,opt,name=difficulty,proto3" json:"difficulty,omitempty"`
	Tags          []string               `protobuf:"bytes,6,rep,name=tags,proto3" json:"tags,omitempty"`
	Icon          string                 `protobuf:"bytes,7,opt,name=icon,proto3" json:"icon,omitempty"`
	LastUpdated   string                 `protobuf:"bytes,8,opt,name=last_updated,json=lastUpdated,proto3" json:"last_updated,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *MapInfo) Reset() {
	*x = MapInfo{}
	mi := &file_weewar_v1_maps_proto_msgTypes[0]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *MapInfo) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*MapInfo) ProtoMessage() {}

func (x *MapInfo) ProtoReflect() protoreflect.Message {
	mi := &file_weewar_v1_maps_proto_msgTypes[0]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use MapInfo.ProtoReflect.Descriptor instead.
func (*MapInfo) Descriptor() ([]byte, []int) {
	return file_weewar_v1_maps_proto_rawDescGZIP(), []int{0}
}

func (x *MapInfo) GetId() string {
	if x != nil {
		return x.Id
	}
	return ""
}

func (x *MapInfo) GetName() string {
	if x != nil {
		return x.Name
	}
	return ""
}

func (x *MapInfo) GetDescription() string {
	if x != nil {
		return x.Description
	}
	return ""
}

func (x *MapInfo) GetCategory() string {
	if x != nil {
		return x.Category
	}
	return ""
}

func (x *MapInfo) GetDifficulty() string {
	if x != nil {
		return x.Difficulty
	}
	return ""
}

func (x *MapInfo) GetTags() []string {
	if x != nil {
		return x.Tags
	}
	return nil
}

func (x *MapInfo) GetIcon() string {
	if x != nil {
		return x.Icon
	}
	return ""
}

func (x *MapInfo) GetLastUpdated() string {
	if x != nil {
		return x.LastUpdated
	}
	return ""
}

// Request messages
type ListMapsRequest struct {
	state protoimpl.MessageState `protogen:"open.v1"`
	// Pagination info
	Pagination *Pagination `protobuf:"bytes,1,opt,name=pagination,proto3" json:"pagination,omitempty"`
	// May be filter by owner id
	OwnerId       string `protobuf:"bytes,2,opt,name=owner_id,json=ownerId,proto3" json:"owner_id,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *ListMapsRequest) Reset() {
	*x = ListMapsRequest{}
	mi := &file_weewar_v1_maps_proto_msgTypes[1]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *ListMapsRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ListMapsRequest) ProtoMessage() {}

func (x *ListMapsRequest) ProtoReflect() protoreflect.Message {
	mi := &file_weewar_v1_maps_proto_msgTypes[1]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ListMapsRequest.ProtoReflect.Descriptor instead.
func (*ListMapsRequest) Descriptor() ([]byte, []int) {
	return file_weewar_v1_maps_proto_rawDescGZIP(), []int{1}
}

func (x *ListMapsRequest) GetPagination() *Pagination {
	if x != nil {
		return x.Pagination
	}
	return nil
}

func (x *ListMapsRequest) GetOwnerId() string {
	if x != nil {
		return x.OwnerId
	}
	return ""
}

type ListMapsResponse struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Items         []*Map                 `protobuf:"bytes,1,rep,name=items,proto3" json:"items,omitempty"`
	Pagination    *PaginationResponse    `protobuf:"bytes,2,opt,name=pagination,proto3" json:"pagination,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *ListMapsResponse) Reset() {
	*x = ListMapsResponse{}
	mi := &file_weewar_v1_maps_proto_msgTypes[2]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *ListMapsResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ListMapsResponse) ProtoMessage() {}

func (x *ListMapsResponse) ProtoReflect() protoreflect.Message {
	mi := &file_weewar_v1_maps_proto_msgTypes[2]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ListMapsResponse.ProtoReflect.Descriptor instead.
func (*ListMapsResponse) Descriptor() ([]byte, []int) {
	return file_weewar_v1_maps_proto_rawDescGZIP(), []int{2}
}

func (x *ListMapsResponse) GetItems() []*Map {
	if x != nil {
		return x.Items
	}
	return nil
}

func (x *ListMapsResponse) GetPagination() *PaginationResponse {
	if x != nil {
		return x.Pagination
	}
	return nil
}

type GetMapRequest struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Id            string                 `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	Version       string                 `protobuf:"bytes,2,opt,name=version,proto3" json:"version,omitempty"` // Optional, defaults to default_version
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *GetMapRequest) Reset() {
	*x = GetMapRequest{}
	mi := &file_weewar_v1_maps_proto_msgTypes[3]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *GetMapRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*GetMapRequest) ProtoMessage() {}

func (x *GetMapRequest) ProtoReflect() protoreflect.Message {
	mi := &file_weewar_v1_maps_proto_msgTypes[3]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use GetMapRequest.ProtoReflect.Descriptor instead.
func (*GetMapRequest) Descriptor() ([]byte, []int) {
	return file_weewar_v1_maps_proto_rawDescGZIP(), []int{3}
}

func (x *GetMapRequest) GetId() string {
	if x != nil {
		return x.Id
	}
	return ""
}

func (x *GetMapRequest) GetVersion() string {
	if x != nil {
		return x.Version
	}
	return ""
}

type GetMapResponse struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Map           *Map                   `protobuf:"bytes,1,opt,name=map,proto3" json:"map,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *GetMapResponse) Reset() {
	*x = GetMapResponse{}
	mi := &file_weewar_v1_maps_proto_msgTypes[4]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *GetMapResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*GetMapResponse) ProtoMessage() {}

func (x *GetMapResponse) ProtoReflect() protoreflect.Message {
	mi := &file_weewar_v1_maps_proto_msgTypes[4]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use GetMapResponse.ProtoReflect.Descriptor instead.
func (*GetMapResponse) Descriptor() ([]byte, []int) {
	return file_weewar_v1_maps_proto_rawDescGZIP(), []int{4}
}

func (x *GetMapResponse) GetMap() *Map {
	if x != nil {
		return x.Map
	}
	return nil
}

type GetMapContentRequest struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Id            string                 `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	Version       string                 `protobuf:"bytes,2,opt,name=version,proto3" json:"version,omitempty"` // Optional, defaults to default_version
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *GetMapContentRequest) Reset() {
	*x = GetMapContentRequest{}
	mi := &file_weewar_v1_maps_proto_msgTypes[5]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *GetMapContentRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*GetMapContentRequest) ProtoMessage() {}

func (x *GetMapContentRequest) ProtoReflect() protoreflect.Message {
	mi := &file_weewar_v1_maps_proto_msgTypes[5]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use GetMapContentRequest.ProtoReflect.Descriptor instead.
func (*GetMapContentRequest) Descriptor() ([]byte, []int) {
	return file_weewar_v1_maps_proto_rawDescGZIP(), []int{5}
}

func (x *GetMapContentRequest) GetId() string {
	if x != nil {
		return x.Id
	}
	return ""
}

func (x *GetMapContentRequest) GetVersion() string {
	if x != nil {
		return x.Version
	}
	return ""
}

type GetMapContentResponse struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	WeewarContent string                 `protobuf:"bytes,1,opt,name=weewar_content,json=weewarContent,proto3" json:"weewar_content,omitempty"`
	RecipeContent string                 `protobuf:"bytes,2,opt,name=recipe_content,json=recipeContent,proto3" json:"recipe_content,omitempty"`
	ReadmeContent string                 `protobuf:"bytes,3,opt,name=readme_content,json=readmeContent,proto3" json:"readme_content,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *GetMapContentResponse) Reset() {
	*x = GetMapContentResponse{}
	mi := &file_weewar_v1_maps_proto_msgTypes[6]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *GetMapContentResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*GetMapContentResponse) ProtoMessage() {}

func (x *GetMapContentResponse) ProtoReflect() protoreflect.Message {
	mi := &file_weewar_v1_maps_proto_msgTypes[6]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use GetMapContentResponse.ProtoReflect.Descriptor instead.
func (*GetMapContentResponse) Descriptor() ([]byte, []int) {
	return file_weewar_v1_maps_proto_rawDescGZIP(), []int{6}
}

func (x *GetMapContentResponse) GetWeewarContent() string {
	if x != nil {
		return x.WeewarContent
	}
	return ""
}

func (x *GetMapContentResponse) GetRecipeContent() string {
	if x != nil {
		return x.RecipeContent
	}
	return ""
}

func (x *GetMapContentResponse) GetReadmeContent() string {
	if x != nil {
		return x.ReadmeContent
	}
	return ""
}

type UpdateMapRequest struct {
	state protoimpl.MessageState `protogen:"open.v1"`
	// *
	// Map being updated
	Map *Map `protobuf:"bytes,1,opt,name=map,proto3" json:"map,omitempty"`
	// *
	// Mask of fields being updated in this Map to make partial changes.
	UpdateMask    *fieldmaskpb.FieldMask `protobuf:"bytes,2,opt,name=update_mask,json=updateMask,proto3" json:"update_mask,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *UpdateMapRequest) Reset() {
	*x = UpdateMapRequest{}
	mi := &file_weewar_v1_maps_proto_msgTypes[7]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *UpdateMapRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*UpdateMapRequest) ProtoMessage() {}

func (x *UpdateMapRequest) ProtoReflect() protoreflect.Message {
	mi := &file_weewar_v1_maps_proto_msgTypes[7]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use UpdateMapRequest.ProtoReflect.Descriptor instead.
func (*UpdateMapRequest) Descriptor() ([]byte, []int) {
	return file_weewar_v1_maps_proto_rawDescGZIP(), []int{7}
}

func (x *UpdateMapRequest) GetMap() *Map {
	if x != nil {
		return x.Map
	}
	return nil
}

func (x *UpdateMapRequest) GetUpdateMask() *fieldmaskpb.FieldMask {
	if x != nil {
		return x.UpdateMask
	}
	return nil
}

// *
// The request for (partially) updating an Map.
type UpdateMapResponse struct {
	state protoimpl.MessageState `protogen:"open.v1"`
	// *
	// Map being updated
	Map           *Map `protobuf:"bytes,1,opt,name=map,proto3" json:"map,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *UpdateMapResponse) Reset() {
	*x = UpdateMapResponse{}
	mi := &file_weewar_v1_maps_proto_msgTypes[8]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *UpdateMapResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*UpdateMapResponse) ProtoMessage() {}

func (x *UpdateMapResponse) ProtoReflect() protoreflect.Message {
	mi := &file_weewar_v1_maps_proto_msgTypes[8]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use UpdateMapResponse.ProtoReflect.Descriptor instead.
func (*UpdateMapResponse) Descriptor() ([]byte, []int) {
	return file_weewar_v1_maps_proto_rawDescGZIP(), []int{8}
}

func (x *UpdateMapResponse) GetMap() *Map {
	if x != nil {
		return x.Map
	}
	return nil
}

// *
// Request to delete an map.
type DeleteMapRequest struct {
	state protoimpl.MessageState `protogen:"open.v1"`
	// *
	// ID of the map to be deleted.
	Id            string `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *DeleteMapRequest) Reset() {
	*x = DeleteMapRequest{}
	mi := &file_weewar_v1_maps_proto_msgTypes[9]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *DeleteMapRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*DeleteMapRequest) ProtoMessage() {}

func (x *DeleteMapRequest) ProtoReflect() protoreflect.Message {
	mi := &file_weewar_v1_maps_proto_msgTypes[9]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use DeleteMapRequest.ProtoReflect.Descriptor instead.
func (*DeleteMapRequest) Descriptor() ([]byte, []int) {
	return file_weewar_v1_maps_proto_rawDescGZIP(), []int{9}
}

func (x *DeleteMapRequest) GetId() string {
	if x != nil {
		return x.Id
	}
	return ""
}

// *
// Map deletion response
type DeleteMapResponse struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *DeleteMapResponse) Reset() {
	*x = DeleteMapResponse{}
	mi := &file_weewar_v1_maps_proto_msgTypes[10]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *DeleteMapResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*DeleteMapResponse) ProtoMessage() {}

func (x *DeleteMapResponse) ProtoReflect() protoreflect.Message {
	mi := &file_weewar_v1_maps_proto_msgTypes[10]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use DeleteMapResponse.ProtoReflect.Descriptor instead.
func (*DeleteMapResponse) Descriptor() ([]byte, []int) {
	return file_weewar_v1_maps_proto_rawDescGZIP(), []int{10}
}

// *
// Request to batch get maps
type GetMapsRequest struct {
	state protoimpl.MessageState `protogen:"open.v1"`
	// *
	// IDs of the map to be fetched
	Ids           []string `protobuf:"bytes,1,rep,name=ids,proto3" json:"ids,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *GetMapsRequest) Reset() {
	*x = GetMapsRequest{}
	mi := &file_weewar_v1_maps_proto_msgTypes[11]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *GetMapsRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*GetMapsRequest) ProtoMessage() {}

func (x *GetMapsRequest) ProtoReflect() protoreflect.Message {
	mi := &file_weewar_v1_maps_proto_msgTypes[11]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use GetMapsRequest.ProtoReflect.Descriptor instead.
func (*GetMapsRequest) Descriptor() ([]byte, []int) {
	return file_weewar_v1_maps_proto_rawDescGZIP(), []int{11}
}

func (x *GetMapsRequest) GetIds() []string {
	if x != nil {
		return x.Ids
	}
	return nil
}

// *
// Map batch-get response
type GetMapsResponse struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Maps          map[string]*Map        `protobuf:"bytes,1,rep,name=maps,proto3" json:"maps,omitempty" protobuf_key:"bytes,1,opt,name=key" protobuf_val:"bytes,2,opt,name=value"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *GetMapsResponse) Reset() {
	*x = GetMapsResponse{}
	mi := &file_weewar_v1_maps_proto_msgTypes[12]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *GetMapsResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*GetMapsResponse) ProtoMessage() {}

func (x *GetMapsResponse) ProtoReflect() protoreflect.Message {
	mi := &file_weewar_v1_maps_proto_msgTypes[12]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use GetMapsResponse.ProtoReflect.Descriptor instead.
func (*GetMapsResponse) Descriptor() ([]byte, []int) {
	return file_weewar_v1_maps_proto_rawDescGZIP(), []int{12}
}

func (x *GetMapsResponse) GetMaps() map[string]*Map {
	if x != nil {
		return x.Maps
	}
	return nil
}

// *
// Map creation request object
type CreateMapRequest struct {
	state protoimpl.MessageState `protogen:"open.v1"`
	// *
	// Map being updated
	Map           *Map `protobuf:"bytes,1,opt,name=map,proto3" json:"map,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *CreateMapRequest) Reset() {
	*x = CreateMapRequest{}
	mi := &file_weewar_v1_maps_proto_msgTypes[13]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *CreateMapRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*CreateMapRequest) ProtoMessage() {}

func (x *CreateMapRequest) ProtoReflect() protoreflect.Message {
	mi := &file_weewar_v1_maps_proto_msgTypes[13]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use CreateMapRequest.ProtoReflect.Descriptor instead.
func (*CreateMapRequest) Descriptor() ([]byte, []int) {
	return file_weewar_v1_maps_proto_rawDescGZIP(), []int{13}
}

func (x *CreateMapRequest) GetMap() *Map {
	if x != nil {
		return x.Map
	}
	return nil
}

// *
// Response of an map creation.
type CreateMapResponse struct {
	state protoimpl.MessageState `protogen:"open.v1"`
	// *
	// Map being created
	Map *Map `protobuf:"bytes,1,opt,name=map,proto3" json:"map,omitempty"`
	// *
	// Error specific to a field if there are any errors.
	FieldErrors   map[string]string `protobuf:"bytes,2,rep,name=field_errors,json=fieldErrors,proto3" json:"field_errors,omitempty" protobuf_key:"bytes,1,opt,name=key" protobuf_val:"bytes,2,opt,name=value"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *CreateMapResponse) Reset() {
	*x = CreateMapResponse{}
	mi := &file_weewar_v1_maps_proto_msgTypes[14]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *CreateMapResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*CreateMapResponse) ProtoMessage() {}

func (x *CreateMapResponse) ProtoReflect() protoreflect.Message {
	mi := &file_weewar_v1_maps_proto_msgTypes[14]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use CreateMapResponse.ProtoReflect.Descriptor instead.
func (*CreateMapResponse) Descriptor() ([]byte, []int) {
	return file_weewar_v1_maps_proto_rawDescGZIP(), []int{14}
}

func (x *CreateMapResponse) GetMap() *Map {
	if x != nil {
		return x.Map
	}
	return nil
}

func (x *CreateMapResponse) GetFieldErrors() map[string]string {
	if x != nil {
		return x.FieldErrors
	}
	return nil
}

var File_weewar_v1_maps_proto protoreflect.FileDescriptor

const file_weewar_v1_maps_proto_rawDesc = "" +
	"\n" +
	"\x14weewar/v1/maps.proto\x12\tweewar.v1\x1a google/protobuf/field_mask.proto\x1a\x16weewar/v1/models.proto\x1a\x1cgoogle/api/annotations.proto\x1a.protoc-gen-openapiv2/options/annotations.proto\"\xd6\x01\n" +
	"\aMapInfo\x12\x0e\n" +
	"\x02id\x18\x01 \x01(\tR\x02id\x12\x12\n" +
	"\x04name\x18\x02 \x01(\tR\x04name\x12 \n" +
	"\vdescription\x18\x03 \x01(\tR\vdescription\x12\x1a\n" +
	"\bcategory\x18\x04 \x01(\tR\bcategory\x12\x1e\n" +
	"\n" +
	"difficulty\x18\x05 \x01(\tR\n" +
	"difficulty\x12\x12\n" +
	"\x04tags\x18\x06 \x03(\tR\x04tags\x12\x12\n" +
	"\x04icon\x18\a \x01(\tR\x04icon\x12!\n" +
	"\flast_updated\x18\b \x01(\tR\vlastUpdated\"c\n" +
	"\x0fListMapsRequest\x125\n" +
	"\n" +
	"pagination\x18\x01 \x01(\v2\x15.weewar.v1.PaginationR\n" +
	"pagination\x12\x19\n" +
	"\bowner_id\x18\x02 \x01(\tR\aownerId\"w\n" +
	"\x10ListMapsResponse\x12$\n" +
	"\x05items\x18\x01 \x03(\v2\x0e.weewar.v1.MapR\x05items\x12=\n" +
	"\n" +
	"pagination\x18\x02 \x01(\v2\x1d.weewar.v1.PaginationResponseR\n" +
	"pagination\"9\n" +
	"\rGetMapRequest\x12\x0e\n" +
	"\x02id\x18\x01 \x01(\tR\x02id\x12\x18\n" +
	"\aversion\x18\x02 \x01(\tR\aversion\"2\n" +
	"\x0eGetMapResponse\x12 \n" +
	"\x03map\x18\x01 \x01(\v2\x0e.weewar.v1.MapR\x03map\"@\n" +
	"\x14GetMapContentRequest\x12\x0e\n" +
	"\x02id\x18\x01 \x01(\tR\x02id\x12\x18\n" +
	"\aversion\x18\x02 \x01(\tR\aversion\"\x8c\x01\n" +
	"\x15GetMapContentResponse\x12%\n" +
	"\x0eweewar_content\x18\x01 \x01(\tR\rweewarContent\x12%\n" +
	"\x0erecipe_content\x18\x02 \x01(\tR\rrecipeContent\x12%\n" +
	"\x0ereadme_content\x18\x03 \x01(\tR\rreadmeContent\"\x8a\x01\n" +
	"\x10UpdateMapRequest\x12 \n" +
	"\x03map\x18\x01 \x01(\v2\x0e.weewar.v1.MapR\x03map\x12;\n" +
	"\vupdate_mask\x18\x02 \x01(\v2\x1a.google.protobuf.FieldMaskR\n" +
	"updateMask:\x17\x92A\x14\n" +
	"\x12*\x10UpdateMapRequest\"O\n" +
	"\x11UpdateMapResponse\x12 \n" +
	"\x03map\x18\x01 \x01(\v2\x0e.weewar.v1.MapR\x03map:\x18\x92A\x15\n" +
	"\x13*\x11UpdateMapResponse\"\"\n" +
	"\x10DeleteMapRequest\x12\x0e\n" +
	"\x02id\x18\x01 \x01(\tR\x02id\"\x13\n" +
	"\x11DeleteMapResponse\"\"\n" +
	"\x0eGetMapsRequest\x12\x10\n" +
	"\x03ids\x18\x01 \x03(\tR\x03ids\"\x94\x01\n" +
	"\x0fGetMapsResponse\x128\n" +
	"\x04maps\x18\x01 \x03(\v2$.weewar.v1.GetMapsResponse.MapsEntryR\x04maps\x1aG\n" +
	"\tMapsEntry\x12\x10\n" +
	"\x03key\x18\x01 \x01(\tR\x03key\x12$\n" +
	"\x05value\x18\x02 \x01(\v2\x0e.weewar.v1.MapR\x05value:\x028\x01\"4\n" +
	"\x10CreateMapRequest\x12 \n" +
	"\x03map\x18\x01 \x01(\v2\x0e.weewar.v1.MapR\x03map\"\xc7\x01\n" +
	"\x11CreateMapResponse\x12 \n" +
	"\x03map\x18\x01 \x01(\v2\x0e.weewar.v1.MapR\x03map\x12P\n" +
	"\ffield_errors\x18\x02 \x03(\v2-.weewar.v1.CreateMapResponse.FieldErrorsEntryR\vfieldErrors\x1a>\n" +
	"\x10FieldErrorsEntry\x12\x10\n" +
	"\x03key\x18\x01 \x01(\tR\x03key\x12\x14\n" +
	"\x05value\x18\x02 \x01(\tR\x05value:\x028\x012\xbd\x04\n" +
	"\vMapsService\x12[\n" +
	"\tCreateMap\x12\x1b.weewar.v1.CreateMapRequest\x1a\x1c.weewar.v1.CreateMapResponse\"\x13\x82\xd3\xe4\x93\x02\r:\x01*\"\b/v1/maps\x12[\n" +
	"\aGetMaps\x12\x19.weewar.v1.GetMapsRequest\x1a\x1a.weewar.v1.GetMapsResponse\"\x19\x82\xd3\xe4\x93\x02\x13\x12\x11/v1/maps:batchGet\x12U\n" +
	"\bListMaps\x12\x1a.weewar.v1.ListMapsRequest\x1a\x1b.weewar.v1.ListMapsResponse\"\x10\x82\xd3\xe4\x93\x02\n" +
	"\x12\b/v1/maps\x12T\n" +
	"\x06GetMap\x12\x18.weewar.v1.GetMapRequest\x1a\x19.weewar.v1.GetMapResponse\"\x15\x82\xd3\xe4\x93\x02\x0f\x12\r/v1/maps/{id}\x12_\n" +
	"\tDeleteMap\x12\x1b.weewar.v1.DeleteMapRequest\x1a\x1c.weewar.v1.DeleteMapResponse\"\x17\x82\xd3\xe4\x93\x02\x11*\x0f/v1/maps/{id=*}\x12f\n" +
	"\tUpdateMap\x12\x1b.weewar.v1.UpdateMapRequest\x1a\x1c.weewar.v1.UpdateMapResponse\"\x1e\x82\xd3\xe4\x93\x02\x18:\x01*2\x13/v1/maps/{map.id=*}B\x9b\x01\n" +
	"\rcom.weewar.v1B\tMapsProtoP\x01Z:github.com/panyam/turnengine/games/weewar/gen/go/weewar/v1\xa2\x02\x03WXX\xaa\x02\tWeewar.V1\xca\x02\tWeewar\\V1\xe2\x02\x15Weewar\\V1\\GPBMetadata\xea\x02\n" +
	"Weewar::V1b\x06proto3"

var (
	file_weewar_v1_maps_proto_rawDescOnce sync.Once
	file_weewar_v1_maps_proto_rawDescData []byte
)

func file_weewar_v1_maps_proto_rawDescGZIP() []byte {
	file_weewar_v1_maps_proto_rawDescOnce.Do(func() {
		file_weewar_v1_maps_proto_rawDescData = protoimpl.X.CompressGZIP(unsafe.Slice(unsafe.StringData(file_weewar_v1_maps_proto_rawDesc), len(file_weewar_v1_maps_proto_rawDesc)))
	})
	return file_weewar_v1_maps_proto_rawDescData
}

var file_weewar_v1_maps_proto_msgTypes = make([]protoimpl.MessageInfo, 17)
var file_weewar_v1_maps_proto_goTypes = []any{
	(*MapInfo)(nil),               // 0: weewar.v1.MapInfo
	(*ListMapsRequest)(nil),       // 1: weewar.v1.ListMapsRequest
	(*ListMapsResponse)(nil),      // 2: weewar.v1.ListMapsResponse
	(*GetMapRequest)(nil),         // 3: weewar.v1.GetMapRequest
	(*GetMapResponse)(nil),        // 4: weewar.v1.GetMapResponse
	(*GetMapContentRequest)(nil),  // 5: weewar.v1.GetMapContentRequest
	(*GetMapContentResponse)(nil), // 6: weewar.v1.GetMapContentResponse
	(*UpdateMapRequest)(nil),      // 7: weewar.v1.UpdateMapRequest
	(*UpdateMapResponse)(nil),     // 8: weewar.v1.UpdateMapResponse
	(*DeleteMapRequest)(nil),      // 9: weewar.v1.DeleteMapRequest
	(*DeleteMapResponse)(nil),     // 10: weewar.v1.DeleteMapResponse
	(*GetMapsRequest)(nil),        // 11: weewar.v1.GetMapsRequest
	(*GetMapsResponse)(nil),       // 12: weewar.v1.GetMapsResponse
	(*CreateMapRequest)(nil),      // 13: weewar.v1.CreateMapRequest
	(*CreateMapResponse)(nil),     // 14: weewar.v1.CreateMapResponse
	nil,                           // 15: weewar.v1.GetMapsResponse.MapsEntry
	nil,                           // 16: weewar.v1.CreateMapResponse.FieldErrorsEntry
	(*Pagination)(nil),            // 17: weewar.v1.Pagination
	(*Map)(nil),                   // 18: weewar.v1.Map
	(*PaginationResponse)(nil),    // 19: weewar.v1.PaginationResponse
	(*fieldmaskpb.FieldMask)(nil), // 20: google.protobuf.FieldMask
}
var file_weewar_v1_maps_proto_depIdxs = []int32{
	17, // 0: weewar.v1.ListMapsRequest.pagination:type_name -> weewar.v1.Pagination
	18, // 1: weewar.v1.ListMapsResponse.items:type_name -> weewar.v1.Map
	19, // 2: weewar.v1.ListMapsResponse.pagination:type_name -> weewar.v1.PaginationResponse
	18, // 3: weewar.v1.GetMapResponse.map:type_name -> weewar.v1.Map
	18, // 4: weewar.v1.UpdateMapRequest.map:type_name -> weewar.v1.Map
	20, // 5: weewar.v1.UpdateMapRequest.update_mask:type_name -> google.protobuf.FieldMask
	18, // 6: weewar.v1.UpdateMapResponse.map:type_name -> weewar.v1.Map
	15, // 7: weewar.v1.GetMapsResponse.maps:type_name -> weewar.v1.GetMapsResponse.MapsEntry
	18, // 8: weewar.v1.CreateMapRequest.map:type_name -> weewar.v1.Map
	18, // 9: weewar.v1.CreateMapResponse.map:type_name -> weewar.v1.Map
	16, // 10: weewar.v1.CreateMapResponse.field_errors:type_name -> weewar.v1.CreateMapResponse.FieldErrorsEntry
	18, // 11: weewar.v1.GetMapsResponse.MapsEntry.value:type_name -> weewar.v1.Map
	13, // 12: weewar.v1.MapsService.CreateMap:input_type -> weewar.v1.CreateMapRequest
	11, // 13: weewar.v1.MapsService.GetMaps:input_type -> weewar.v1.GetMapsRequest
	1,  // 14: weewar.v1.MapsService.ListMaps:input_type -> weewar.v1.ListMapsRequest
	3,  // 15: weewar.v1.MapsService.GetMap:input_type -> weewar.v1.GetMapRequest
	9,  // 16: weewar.v1.MapsService.DeleteMap:input_type -> weewar.v1.DeleteMapRequest
	7,  // 17: weewar.v1.MapsService.UpdateMap:input_type -> weewar.v1.UpdateMapRequest
	14, // 18: weewar.v1.MapsService.CreateMap:output_type -> weewar.v1.CreateMapResponse
	12, // 19: weewar.v1.MapsService.GetMaps:output_type -> weewar.v1.GetMapsResponse
	2,  // 20: weewar.v1.MapsService.ListMaps:output_type -> weewar.v1.ListMapsResponse
	4,  // 21: weewar.v1.MapsService.GetMap:output_type -> weewar.v1.GetMapResponse
	10, // 22: weewar.v1.MapsService.DeleteMap:output_type -> weewar.v1.DeleteMapResponse
	8,  // 23: weewar.v1.MapsService.UpdateMap:output_type -> weewar.v1.UpdateMapResponse
	18, // [18:24] is the sub-list for method output_type
	12, // [12:18] is the sub-list for method input_type
	12, // [12:12] is the sub-list for extension type_name
	12, // [12:12] is the sub-list for extension extendee
	0,  // [0:12] is the sub-list for field type_name
}

func init() { file_weewar_v1_maps_proto_init() }
func file_weewar_v1_maps_proto_init() {
	if File_weewar_v1_maps_proto != nil {
		return
	}
	file_weewar_v1_models_proto_init()
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: unsafe.Slice(unsafe.StringData(file_weewar_v1_maps_proto_rawDesc), len(file_weewar_v1_maps_proto_rawDesc)),
			NumEnums:      0,
			NumMessages:   17,
			NumExtensions: 0,
			NumServices:   1,
		},
		GoTypes:           file_weewar_v1_maps_proto_goTypes,
		DependencyIndexes: file_weewar_v1_maps_proto_depIdxs,
		MessageInfos:      file_weewar_v1_maps_proto_msgTypes,
	}.Build()
	File_weewar_v1_maps_proto = out.File
	file_weewar_v1_maps_proto_goTypes = nil
	file_weewar_v1_maps_proto_depIdxs = nil
}
