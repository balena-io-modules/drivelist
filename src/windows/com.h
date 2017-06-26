#ifndef SRC_WINDOWS_COM_H_
#define SRC_WINDOWS_COM_H_

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

#define _WIN32_DCOM
#include <Wbemidl.h>
#include <comdef.h>

namespace drivelist {
namespace com {

HRESULT Initialize();
void Uninitialize();

class Connection {
 public:
  Connection();
  ~Connection();

  HRESULT Connect(const PCWSTR server);
  HRESULT CreateInstance();
  HRESULT ExecuteWQLQuery(const BSTR query, IEnumWbemClassObject **enumerator);
 private:
  IWbemLocator *locator;
  IWbemServices *proxy;
};

}  // namespace com
}  // namespace drivelist

#endif  // SRC_WINDOWS_COM_H_
