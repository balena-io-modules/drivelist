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
#include <vector>
#include "drivelist.hpp"

class DriveListWorker : public Napi::AsyncWorker {
public:
  explicit DriveListWorker(const Napi::Function &callback)
    : Napi::AsyncWorker(callback), devices() {}

  ~DriveListWorker() {}

  void Execute() {
    devices = Drivelist::ListStorageDevices();
  }

private:
  virtual void OnOK() override {
    Napi::HandleScope scope(Env());

    uint32_t i;
    uint32_t size = (uint32_t) devices.size();

    Napi::Array result = Napi::Array::New(Env());

    for (i = 0; i < size; i++) {
      result.Set(i, Drivelist::PackDriveDescriptor(Env(), &devices[i]));
    }

    Callback().Call(Receiver().Value(), std::initializer_list<napi_value>{ Env().Null(), result });
  }

private:
  std::vector<Drivelist::DeviceDescriptor> devices;
};

Napi::Value list(const Napi::CallbackInfo &info) {
  if (!info[0].IsFunction()) {
    throw Napi::Error::New(info.Env(), "Callback must be a function");
  }

  auto worker = new DriveListWorker(info[0].As<Napi::Function>());

  worker->Queue();

  return info.Env().Undefined();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("list", Napi::Function::New(env, list));

  return exports;
}

NODE_API_MODULE(Drivelist, Init)

