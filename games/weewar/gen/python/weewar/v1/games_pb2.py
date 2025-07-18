# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: weewar/v1/games.proto
# Protobuf Python Version: 6.31.1
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import runtime_version as _runtime_version
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
_runtime_version.ValidateProtobufRuntimeVersion(
    _runtime_version.Domain.PUBLIC,
    6,
    31,
    1,
    '',
    'weewar/v1/games.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from google.protobuf import field_mask_pb2 as google_dot_protobuf_dot_field__mask__pb2
from weewar.v1 import models_pb2 as weewar_dot_v1_dot_models__pb2
from google.api import annotations_pb2 as google_dot_api_dot_annotations__pb2
from protoc_gen_openapiv2.options import annotations_pb2 as protoc__gen__openapiv2_dot_options_dot_annotations__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x15weewar/v1/games.proto\x12\tweewar.v1\x1a google/protobuf/field_mask.proto\x1a\x16weewar/v1/models.proto\x1a\x1cgoogle/api/annotations.proto\x1a.protoc-gen-openapiv2/options/annotations.proto\"\xd7\x01\n\x08GameInfo\x12\x0e\n\x02id\x18\x01 \x01(\tR\x02id\x12\x12\n\x04name\x18\x02 \x01(\tR\x04name\x12 \n\x0b\x64\x65scription\x18\x03 \x01(\tR\x0b\x64\x65scription\x12\x1a\n\x08\x63\x61tegory\x18\x04 \x01(\tR\x08\x63\x61tegory\x12\x1e\n\ndifficulty\x18\x05 \x01(\tR\ndifficulty\x12\x12\n\x04tags\x18\x06 \x03(\tR\x04tags\x12\x12\n\x04icon\x18\x07 \x01(\tR\x04icon\x12!\n\x0clast_updated\x18\x08 \x01(\tR\x0blastUpdated\"d\n\x10ListGamesRequest\x12\x35\n\npagination\x18\x01 \x01(\x0b\x32\x15.weewar.v1.PaginationR\npagination\x12\x19\n\x08owner_id\x18\x02 \x01(\tR\x07ownerId\"y\n\x11ListGamesResponse\x12%\n\x05items\x18\x01 \x03(\x0b\x32\x0f.weewar.v1.GameR\x05items\x12=\n\npagination\x18\x02 \x01(\x0b\x32\x1d.weewar.v1.PaginationResponseR\npagination\":\n\x0eGetGameRequest\x12\x0e\n\x02id\x18\x01 \x01(\tR\x02id\x12\x18\n\x07version\x18\x02 \x01(\tR\x07version\"6\n\x0fGetGameResponse\x12#\n\x04game\x18\x01 \x01(\x0b\x32\x0f.weewar.v1.GameR\x04game\"A\n\x15GetGameContentRequest\x12\x0e\n\x02id\x18\x01 \x01(\tR\x02id\x12\x18\n\x07version\x18\x02 \x01(\tR\x07version\"\x8d\x01\n\x16GetGameContentResponse\x12%\n\x0eweewar_content\x18\x01 \x01(\tR\rweewarContent\x12%\n\x0erecipe_content\x18\x02 \x01(\tR\rrecipeContent\x12%\n\x0ereadme_content\x18\x03 \x01(\tR\rreadmeContent\"\x8f\x01\n\x11UpdateGameRequest\x12#\n\x04game\x18\x01 \x01(\x0b\x32\x0f.weewar.v1.GameR\x04game\x12;\n\x0bupdate_mask\x18\x02 \x01(\x0b\x32\x1a.google.protobuf.FieldMaskR\nupdateMask:\x18\x92\x41\x15\n\x13*\x11UpdateGameRequest\"T\n\x12UpdateGameResponse\x12#\n\x04game\x18\x01 \x01(\x0b\x32\x0f.weewar.v1.GameR\x04game:\x19\x92\x41\x16\n\x14*\x12UpdateGameResponse\"#\n\x11\x44\x65leteGameRequest\x12\x0e\n\x02id\x18\x01 \x01(\tR\x02id\"\x14\n\x12\x44\x65leteGameResponse\"#\n\x0fGetGamesRequest\x12\x10\n\x03ids\x18\x01 \x03(\tR\x03ids\"\x9b\x01\n\x10GetGamesResponse\x12<\n\x05games\x18\x01 \x03(\x0b\x32&.weewar.v1.GetGamesResponse.GamesEntryR\x05games\x1aI\n\nGamesEntry\x12\x10\n\x03key\x18\x01 \x01(\tR\x03key\x12%\n\x05value\x18\x02 \x01(\x0b\x32\x0f.weewar.v1.GameR\x05value:\x02\x38\x01\"8\n\x11\x43reateGameRequest\x12#\n\x04game\x18\x01 \x01(\x0b\x32\x0f.weewar.v1.GameR\x04game\"\xcc\x01\n\x12\x43reateGameResponse\x12#\n\x04game\x18\x01 \x01(\x0b\x32\x0f.weewar.v1.GameR\x04game\x12Q\n\x0c\x66ield_errors\x18\x02 \x03(\x0b\x32..weewar.v1.CreateGameResponse.FieldErrorsEntryR\x0b\x66ieldErrors\x1a>\n\x10\x46ieldErrorsEntry\x12\x10\n\x03key\x18\x01 \x01(\tR\x03key\x12\x14\n\x05value\x18\x02 \x01(\tR\x05value:\x02\x38\x01\x32\xd7\x04\n\x0cGamesService\x12_\n\nCreateGame\x12\x1c.weewar.v1.CreateGameRequest\x1a\x1d.weewar.v1.CreateGameResponse\"\x14\x82\xd3\xe4\x93\x02\x0e\"\t/v1/games:\x01*\x12_\n\x08GetGames\x12\x1a.weewar.v1.GetGamesRequest\x1a\x1b.weewar.v1.GetGamesResponse\"\x1a\x82\xd3\xe4\x93\x02\x14\x12\x12/v1/games:batchGet\x12Y\n\tListGames\x12\x1b.weewar.v1.ListGamesRequest\x1a\x1c.weewar.v1.ListGamesResponse\"\x11\x82\xd3\xe4\x93\x02\x0b\x12\t/v1/games\x12X\n\x07GetGame\x12\x19.weewar.v1.GetGameRequest\x1a\x1a.weewar.v1.GetGameResponse\"\x16\x82\xd3\xe4\x93\x02\x10\x12\x0e/v1/games/{id}\x12\x63\n\nDeleteGame\x12\x1c.weewar.v1.DeleteGameRequest\x1a\x1d.weewar.v1.DeleteGameResponse\"\x18\x82\xd3\xe4\x93\x02\x12*\x10/v1/games/{id=*}\x12k\n\nUpdateGame\x12\x1c.weewar.v1.UpdateGameRequest\x1a\x1d.weewar.v1.UpdateGameResponse\" \x82\xd3\xe4\x93\x02\x1a\x32\x15/v1/games/{game.id=*}:\x01*B\x9c\x01\n\rcom.weewar.v1B\nGamesProtoP\x01Z:github.com/panyam/turnengine/games/weewar/gen/go/weewar/v1\xa2\x02\x03WXX\xaa\x02\tWeewar.V1\xca\x02\tWeewar\\V1\xe2\x02\x15Weewar\\V1\\GPBMetadata\xea\x02\nWeewar::V1b\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'weewar.v1.games_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'\n\rcom.weewar.v1B\nGamesProtoP\001Z:github.com/panyam/turnengine/games/weewar/gen/go/weewar/v1\242\002\003WXX\252\002\tWeewar.V1\312\002\tWeewar\\V1\342\002\025Weewar\\V1\\GPBMetadata\352\002\nWeewar::V1'
  _globals['_UPDATEGAMEREQUEST']._loaded_options = None
  _globals['_UPDATEGAMEREQUEST']._serialized_options = b'\222A\025\n\023*\021UpdateGameRequest'
  _globals['_UPDATEGAMERESPONSE']._loaded_options = None
  _globals['_UPDATEGAMERESPONSE']._serialized_options = b'\222A\026\n\024*\022UpdateGameResponse'
  _globals['_GETGAMESRESPONSE_GAMESENTRY']._loaded_options = None
  _globals['_GETGAMESRESPONSE_GAMESENTRY']._serialized_options = b'8\001'
  _globals['_CREATEGAMERESPONSE_FIELDERRORSENTRY']._loaded_options = None
  _globals['_CREATEGAMERESPONSE_FIELDERRORSENTRY']._serialized_options = b'8\001'
  _globals['_GAMESSERVICE'].methods_by_name['CreateGame']._loaded_options = None
  _globals['_GAMESSERVICE'].methods_by_name['CreateGame']._serialized_options = b'\202\323\344\223\002\016\"\t/v1/games:\001*'
  _globals['_GAMESSERVICE'].methods_by_name['GetGames']._loaded_options = None
  _globals['_GAMESSERVICE'].methods_by_name['GetGames']._serialized_options = b'\202\323\344\223\002\024\022\022/v1/games:batchGet'
  _globals['_GAMESSERVICE'].methods_by_name['ListGames']._loaded_options = None
  _globals['_GAMESSERVICE'].methods_by_name['ListGames']._serialized_options = b'\202\323\344\223\002\013\022\t/v1/games'
  _globals['_GAMESSERVICE'].methods_by_name['GetGame']._loaded_options = None
  _globals['_GAMESSERVICE'].methods_by_name['GetGame']._serialized_options = b'\202\323\344\223\002\020\022\016/v1/games/{id}'
  _globals['_GAMESSERVICE'].methods_by_name['DeleteGame']._loaded_options = None
  _globals['_GAMESSERVICE'].methods_by_name['DeleteGame']._serialized_options = b'\202\323\344\223\002\022*\020/v1/games/{id=*}'
  _globals['_GAMESSERVICE'].methods_by_name['UpdateGame']._loaded_options = None
  _globals['_GAMESSERVICE'].methods_by_name['UpdateGame']._serialized_options = b'\202\323\344\223\002\0322\025/v1/games/{game.id=*}:\001*'
  _globals['_GAMEINFO']._serialized_start=173
  _globals['_GAMEINFO']._serialized_end=388
  _globals['_LISTGAMESREQUEST']._serialized_start=390
  _globals['_LISTGAMESREQUEST']._serialized_end=490
  _globals['_LISTGAMESRESPONSE']._serialized_start=492
  _globals['_LISTGAMESRESPONSE']._serialized_end=613
  _globals['_GETGAMEREQUEST']._serialized_start=615
  _globals['_GETGAMEREQUEST']._serialized_end=673
  _globals['_GETGAMERESPONSE']._serialized_start=675
  _globals['_GETGAMERESPONSE']._serialized_end=729
  _globals['_GETGAMECONTENTREQUEST']._serialized_start=731
  _globals['_GETGAMECONTENTREQUEST']._serialized_end=796
  _globals['_GETGAMECONTENTRESPONSE']._serialized_start=799
  _globals['_GETGAMECONTENTRESPONSE']._serialized_end=940
  _globals['_UPDATEGAMEREQUEST']._serialized_start=943
  _globals['_UPDATEGAMEREQUEST']._serialized_end=1086
  _globals['_UPDATEGAMERESPONSE']._serialized_start=1088
  _globals['_UPDATEGAMERESPONSE']._serialized_end=1172
  _globals['_DELETEGAMEREQUEST']._serialized_start=1174
  _globals['_DELETEGAMEREQUEST']._serialized_end=1209
  _globals['_DELETEGAMERESPONSE']._serialized_start=1211
  _globals['_DELETEGAMERESPONSE']._serialized_end=1231
  _globals['_GETGAMESREQUEST']._serialized_start=1233
  _globals['_GETGAMESREQUEST']._serialized_end=1268
  _globals['_GETGAMESRESPONSE']._serialized_start=1271
  _globals['_GETGAMESRESPONSE']._serialized_end=1426
  _globals['_GETGAMESRESPONSE_GAMESENTRY']._serialized_start=1353
  _globals['_GETGAMESRESPONSE_GAMESENTRY']._serialized_end=1426
  _globals['_CREATEGAMEREQUEST']._serialized_start=1428
  _globals['_CREATEGAMEREQUEST']._serialized_end=1484
  _globals['_CREATEGAMERESPONSE']._serialized_start=1487
  _globals['_CREATEGAMERESPONSE']._serialized_end=1691
  _globals['_CREATEGAMERESPONSE_FIELDERRORSENTRY']._serialized_start=1629
  _globals['_CREATEGAMERESPONSE_FIELDERRORSENTRY']._serialized_end=1691
  _globals['_GAMESSERVICE']._serialized_start=1694
  _globals['_GAMESSERVICE']._serialized_end=2293
# @@protoc_insertion_point(module_scope)
