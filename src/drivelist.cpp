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

#include "drivelist.hpp"

#include <napi.h>

#include <vector>

class DriveListWorker : public Napi::AsyncWorker {
 public:
  explicit DriveListWorker(Napi::Function& callback)
      : Napi::AsyncWorker(callback), devices() {}

  virtual ~DriveListWorker() {}

  void Execute() { devices = Drivelist::ListStorageDevices(); }

  void OnOK() {
    Napi::HandleScope scope(Env());
    Napi::Object drives = Napi::Array::New(Env());

    uint32_t i;
    uint32_t size = (uint32_t)devices.size();

    for (i = 0; i < size; i++) {
      drives.Set(i, Drivelist::PackDriveDescriptor(Env(), &devices[i]));
    }

    Callback().Call({Env().Undefined(), drives});
  }

 private:
  std::vector<Drivelist::DeviceDescriptor> devices;
};

Napi::Value List(const Napi::CallbackInfo& info) {
  if (!info[0].IsFunction()) {
    Napi::TypeError::New(info.Env(), "Callback must be a function")
        .ThrowAsJavaScriptException();
    return info.Env().Null();
  }

  Napi::Function callback = info[0].As<Napi::Function>();
  DriveListWorker* dlWorker = new DriveListWorker(callback);
  dlWorker->Queue();

  return info.Env().Undefined();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "list"), Napi::Function::New(env, List));
  return exports;
}

NODE_API_MODULE(DriveList, Init)