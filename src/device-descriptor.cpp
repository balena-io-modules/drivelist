/*
 * Copyright 2017 balena.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <napi.h>
#include "drivelist.hpp"

namespace Drivelist {

Napi::Object PackDriveDescriptor(Napi::Env env, const DeviceDescriptor *instance) {
  Napi::Object object = Napi::Object::New(env);

  object.Set("enumerator", Napi::String::New(env, instance->enumerator));

  object.Set("busType", Napi::String::New(env, instance->busType));

  object.Set("busVersion", instance->busVersionNull
    ? env.Null()
    : Napi::String::New(env, instance->busVersion));

  object.Set("device", Napi::String::New(env, instance->device));

  object.Set("devicePath", instance->devicePathNull
    ? env.Null()
    : Napi::String::New(env, instance->devicePath));

  object.Set("raw", Napi::String::New(env, instance->raw));

  object.Set("description", Napi::String::New(env, instance->description));

  object.Set("partitionTableType", (instance->partitionTableType != "")
    ? Napi::String::New(env, instance->partitionTableType)
    : env.Null());

  object.Set("error", (instance->error != "")
    ? Napi::String::New(env, instance->error)
    : env.Null());

  object.Set("size", Napi::Number::New(env, static_cast<double>(instance->size)));

  object.Set("blockSize", Napi::Number::New(env, static_cast<double>(instance->blockSize)));

  object.Set("logicalBlockSize", Napi::Number::New(env, static_cast<double>(instance->logicalBlockSize)));

  Napi::Array mountpoints = Napi::Array::New(env);

  uint32_t index = 0;
  for (std::string mountpointPath : instance->mountpoints) {
    Napi::Object mountpoint = Napi::Object::New(env);
    mountpoint.Set("path", Napi::String::New(env, mountpointPath));

    if (index < instance->mountpointLabels.size()) {
      mountpoint.Set("label", Napi::String::New(env, instance->mountpointLabels[index]));
    }

    mountpoints.Set(index, mountpoint);
    ++index;
  }

  object.Set("mountpoints", mountpoints);
  object.Set("isReadOnly", Napi::Boolean::New(env, instance->isReadOnly));
  object.Set("isSystem", Napi::Boolean::New(env, instance->isSystem));
  object.Set("isVirtual", Napi::Boolean::New(env, instance->isVirtual));
  object.Set("isRemovable", Napi::Boolean::New(env, instance->isRemovable));
  object.Set("isCard", Napi::Boolean::New(env, instance->isCard));
  object.Set("isSCSI", Napi::Boolean::New(env, instance->isSCSI));
  object.Set("isUSB", Napi::Boolean::New(env, instance->isUSB));
  object.Set("isUAS", instance->isUASNull
    ? env.Null()
    : Napi::Boolean::New(env, instance->isUAS));

  return object;
}

}  // namespace Drivelist
