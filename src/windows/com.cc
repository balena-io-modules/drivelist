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

#include "src/windows/com.h"
#include "src/log.h"

HRESULT drivelist::com::Initialize() {
  HRESULT result;

  drivelist::Debug("Initializing COM");
  result = CoInitializeEx(NULL, COINIT_MULTITHREADED);
  if (FAILED(result))
    return result;

  drivelist::Debug("Initializing COM security levels");
  result = CoInitializeSecurity(
    NULL,                         // Security descriptor
    -1,                           // COM authentication
    NULL,                         // Authentication services
    NULL,                         // Reserved
    RPC_C_AUTHN_LEVEL_DEFAULT,    // Default authentication
    RPC_C_IMP_LEVEL_IMPERSONATE,  // Default Impersonation
    NULL,                         // Authentication info
    EOAC_NONE,                    // Additional capabilities
    NULL);                        // Reserved

  // This error can be thrown when COM was already initialized,
  // which can be the case if the user runs various scans at
  // the same time on the same process.
  // TODO(jviotti): This workaround assumes that if RPC_E_TOO_LATE
  // is returned, COM was already initialized for the current process,
  // however the right solution is to get rid of COM altogether.
  // See: https://msdn.microsoft.com/en-us/library/windows/desktop/ms693736(v=vs.85).aspx
  if (result == RPC_E_TOO_LATE) {
    drivelist::Debug("COM is already initialized, continuing...");
    return S_OK;
  }

  if (FAILED(result)) {
    drivelist::com::Uninitialize();
  }

  return result;
}

void drivelist::com::Uninitialize() { CoUninitialize(); }

drivelist::com::Connection::Connection() {
  this->locator = NULL;
  this->proxy = NULL;
}

drivelist::com::Connection::~Connection() {
  if (this->proxy != NULL)
    this->proxy->Release();
  if (this->locator != NULL)
    this->locator->Release();
}

HRESULT drivelist::com::Connection::Connect(const LPCWSTR server) {
  drivelist::Debug("Connecting to server");
  const HRESULT result = this->locator->ConnectServer(
    _bstr_t(server),         // Path to server
    NULL,                    // User name. NULL = current user
    NULL,                    // User password. NULL = current
    0,                       // Locale. NULL indicates current
    NULL,                    // Security flags.
    0,                       // Authority (for example, Kerberos)
    0,                       // Context object
    &this->proxy);           // pointer to IWbemServices proxy

  if (FAILED(result)) {
    return result;
  }

  drivelist::Debug("Setting proxy security levels");
  return CoSetProxyBlanket(
    this->proxy,                  // Indicates the proxy to set
    RPC_C_AUTHN_WINNT,            // RPC_C_AUTHN_xxx
    RPC_C_AUTHZ_NONE,             // RPC_C_AUTHZ_xxx
    NULL,                         // Server principal name
    RPC_C_AUTHN_LEVEL_CALL,       // RPC_C_AUTHN_LEVEL_xxx
    RPC_C_IMP_LEVEL_IMPERSONATE,  // RPC_C_IMP_LEVEL_xxx
    NULL,                         // client identity
    EOAC_NONE);                   // proxy capabilities
}

HRESULT drivelist::com::Connection::CreateInstance() {
  drivelist::Debug("Creating connection instance");
  return CoCreateInstance(
    CLSID_WbemLocator,
    NULL,  // Not being created as part of an aggregate

    // The COM instance context
    //
    // From https://msdn.microsoft.com/en-us/library/windows/desktop/ms693716(v=vs.85).aspx
    //
    // > The code that creates and manages objects of this class
    // > is a DLL that runs in the same process as the caller of
    // > the function specifying the class context.
    CLSCTX_INPROC_SERVER,

    IID_IWbemLocator,
    reinterpret_cast<LPVOID *>(&this->locator));
}

HRESULT
drivelist::com::Connection::ExecuteWQLQuery(const BSTR query,
                                            IEnumWbemClassObject **enumerator) {
  return this->proxy->ExecQuery(
    bstr_t("WQL"),
    query,
    WBEM_FLAG_FORWARD_ONLY | WBEM_FLAG_RETURN_IMMEDIATELY,
    NULL,
    enumerator);
}
