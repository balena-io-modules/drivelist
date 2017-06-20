#ifndef SRC_WINDOWS_WMI_H_
#define SRC_WINDOWS_WMI_H_

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

#include <Wbemidl.h>
#include "src/windows/com.h"

namespace drivelist {
namespace wmi {

HRESULT ConnectToLocalComputer(drivelist::com::Connection * const connection);

class Query {
 public:
  explicit Query(BSTR query);
  ~Query();

  HRESULT Execute(drivelist::com::Connection * const connection);
  bool HasResult();
  HRESULT SelectNext();
  HRESULT GetPropertyString(const LPCWSTR property, BSTR *out);
  HRESULT GetPropertyCharacter(const LPCWSTR property, wchar_t *out);
  HRESULT GetPropertyNumber(const LPCWSTR property, ULONG *out);
  HRESULT HasPropertyString(const LPCWSTR property, BOOL *out);
 private:
  void ClearResult();
  BSTR query;
  IEnumWbemClassObject *enumerator;
  IWbemClassObject *classObject;
  ULONG code;
};

}  // namespace wmi
}  // namespace drivelist

#endif  // SRC_WINDOWS_WMI_H_
