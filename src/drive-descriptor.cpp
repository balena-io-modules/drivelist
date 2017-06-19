/*
 * Copyright 2017 resin.io
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

#include <nan.h>
#include "drivelist.hpp"

using v8::String;
using v8::Number;
using v8::Boolean;
using Nan::New;

v8::Local<v8::Object> pack_drive_descriptor(const DriveDescriptor *instance) {
  v8::Local<v8::Object> object = Nan::New<v8::Object>();

  Nan::Set(object,
    New<String>("device").ToLocalChecked(),
    New<String>(instance->device).ToLocalChecked());
  Nan::Set(object,
    New<String>("raw").ToLocalChecked(),
    New<String>(instance->raw).ToLocalChecked());
  Nan::Set(object,
    New<String>("description").ToLocalChecked(),
    New<String>(instance->description).ToLocalChecked());
  Nan::Set(object,
    New<String>("size").ToLocalChecked(),
    New<Number>(instance->size));

  // TODO(jhermsmeier): Impl packing mountpoints
  // Nan::Set(object,
  //   New<String>("mountpoints").ToLocalChecked(),
  //   mountpoints);

  Nan::Set(object,
    New<String>("isProtected").ToLocalChecked(),
    New<Boolean>(instance->isProtected));
  Nan::Set(object,
    New<String>("isSystem").ToLocalChecked(),
    New<Boolean>(instance->isSystem));

  return object;
}
