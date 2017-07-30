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

#include "src/drivelist.h"
#include <nan.h>
#include <codecvt>
#include <string>
#include <vector>
#include "src/code.h"
#include "src/disk.h"
#include "src/scanner.h"

static v8::Local<v8::Object>
PackMountpoint(const struct drivelist::mountpoint_s &mountpoint) {
  v8::Local<v8::Object> object = Nan::New<v8::Object>();

  Nan::Set(object, Nan::New<v8::String>("path").ToLocalChecked(),
           Nan::New<v8::String>(mountpoint.path).ToLocalChecked());

  return object;
}

static v8::Local<v8::Object> PackDisk(const struct drivelist::disk_s &disk) {
  v8::Local<v8::Object> object = Nan::New<v8::Object>();

  Nan::Set(object, Nan::New<v8::String>("device").ToLocalChecked(),
           Nan::New<v8::String>(disk.id).ToLocalChecked());

  Nan::Set(object, Nan::New<v8::String>("raw").ToLocalChecked(),
           Nan::New<v8::String>(disk.id).ToLocalChecked());

  Nan::Set(object, Nan::New<v8::String>("displayName").ToLocalChecked(),
           Nan::New<v8::String>(disk.displayName).ToLocalChecked());

  Nan::Set(object, Nan::New<v8::String>("description").ToLocalChecked(),
           Nan::New<v8::String>(disk.caption).ToLocalChecked());

  Nan::Set(object, Nan::New<v8::String>("size").ToLocalChecked(),
           Nan::New<v8::Number>(static_cast<double>(disk.size)));

  bool isSystem = !disk.removable;
  bool isProtected = false;

  v8::Local<v8::Object> mountpoints = Nan::New<v8::Array>();

  uint32_t index = 0;
  for (struct drivelist::mountpoint_s mountpoint : disk.mountpoints) {
    if (mountpoint.system)
      isSystem = true;
    if (mountpoint.readonly)
      isProtected = true;

    if (mountpoint.hasFilesystem) {
      Nan::Set(mountpoints, index, PackMountpoint(mountpoint));
      index++;
    }
  }

  Nan::Set(object, Nan::New<v8::String>("system").ToLocalChecked(),
           Nan::New<v8::Boolean>(isSystem));

  Nan::Set(object, Nan::New<v8::String>("protected").ToLocalChecked(),
           Nan::New<v8::Boolean>(isProtected));

  Nan::Set(object, Nan::New<v8::String>("mountpoints").ToLocalChecked(),
           mountpoints);

  return object;
}

static v8::Local<v8::Object>
PackDiskList(const std::vector<drivelist::disk_s> &disks) {
  v8::Local<v8::Object> array = Nan::New<v8::Array>();

  for (uint32_t index = 0; index < disks.size(); index++) {
    Nan::Set(array, index, PackDisk(disks[index]));
  }

  return array;
}

class DrivelistWorker : public Nan::AsyncWorker {
 public:
  explicit DrivelistWorker(Nan::Callback *callback)
    : Nan::AsyncWorker(callback), scanner(), disks() {}
  ~DrivelistWorker() {}

  void Execute() {
    drivelist::Code code = this->scanner.Initialize();
    if (code != drivelist::Code::SUCCESS) {
      const std::string message = "Couldn't initialize the scanner: "
        + drivelist::GetCodeString(code);
      this->SetErrorMessage(message.c_str());
      return;
    }

    code = this->scanner.Scan(&this->disks);
    if (code != drivelist::Code::SUCCESS) {
      const std::string message = "Couldn't scan the drives: "
        + drivelist::GetCodeString(code);
      this->SetErrorMessage(message.c_str());
      return;
    }

    code = this->scanner.Uninitialize();
    if (code != drivelist::Code::SUCCESS) {
      const std::string message = "Couldn't uninitialize the scanner: "
        + drivelist::GetCodeString(code);
      this->SetErrorMessage(message.c_str());
      return;
    }
  }

  void HandleOKCallback() {
    const unsigned argc = 2;
    v8::Local<v8::Value> argv[argc] = { Nan::Null(), PackDiskList(disks) };
    callback->Call(argc, argv);
  }

 private:
  drivelist::Scanner scanner;
  std::vector<drivelist::disk_s> disks;
};

NAN_METHOD(list) {
  if (!info[0]->IsFunction()) {
    return Nan::ThrowTypeError("Callback must be a function");
  }

  Nan::Callback *callback = new Nan::Callback(info[0].As<v8::Function>());
  Nan::AsyncQueueWorker(new DrivelistWorker(callback));
  info.GetReturnValue().SetUndefined();
}

NAN_MODULE_INIT(DrivelistInit) {
  NAN_EXPORT(target, list);
}

NODE_MODULE(Drivelist, DrivelistInit)
