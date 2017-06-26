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

#include "src/windows/wmi.h"

HRESULT
drivelist::wmi::ConnectToLocalComputer(
    drivelist::com::Connection *const connection) {
  const HRESULT result = connection->CreateInstance();
  if (FAILED(result))
    return result;
  return connection->Connect(L"ROOT\\CIMV2");
}

drivelist::wmi::Query::Query(BSTR query) {
  this->enumerator = NULL;
  this->classObject = NULL;
  this->code = 0;
  this->query = query;
}

void drivelist::wmi::Query::ClearResult() {
  if (this->code > 0) {
    this->classObject->Release();
    this->code = 0;
  }
}

drivelist::wmi::Query::~Query() {
  drivelist::wmi::Query::ClearResult();
  this->enumerator->Release();
}

HRESULT
drivelist::wmi::Query::Execute(drivelist::com::Connection *const connection) {
  const HRESULT result =
      connection->ExecuteWQLQuery(this->query, &this->enumerator);
  if (FAILED(result))
    return result;

  // Select the first one automatically
  return SelectNext();
}

bool drivelist::wmi::Query::HasResult() {
  return this->enumerator != NULL && this->code != 0;
}

HRESULT drivelist::wmi::Query::SelectNext() {
  // Ensure the previous query is freed before
  // replacing it with the new one
  ClearResult();

  return this->enumerator->Next(
      WBEM_INFINITE,       // Timeout
      1,                   // Request only one object
      &this->classObject,  // The object to hold the returned object pointers
      &this->code);        // The number of returned objects
}

HRESULT drivelist::wmi::Query::GetPropertyString(const LPCWSTR property,
                                                 BSTR *out) {
  VARIANT variant;
  VariantClear(&variant);
  const HRESULT result =
      this->classObject->Get(property, 0, &variant, NULL, NULL);
  if (FAILED(result))
    return result;

  if (variant.bstrVal == NULL) {
    *out = NULL;
  } else {
    *out = SysAllocString(variant.bstrVal);
    if (*out == NULL)
      return E_FAIL;
  }

  return result;
}

HRESULT
drivelist::wmi::Query::GetPropertyCharacter(const LPCWSTR property,
                                            wchar_t *out) {
  BSTR temp;
  const HRESULT result = GetPropertyString(property, &temp);
  if (FAILED(result))
    return result;

  if (temp == NULL) {
    *out = NULL;
  } else {
    *out = temp[0];
    SysFreeString(temp);
  }

  return result;
}

static const int kVariantTypeLongInteger = 3;

HRESULT
drivelist::wmi::Query::GetPropertyNumber(const LPCWSTR property, ULONG *out) {
  VARIANT variant;
  VariantClear(&variant);
  const HRESULT result =
      this->classObject->Get(property, 0, &variant, NULL, NULL);
  if (FAILED(result))
    return result;

  // See https://msdn.microsoft.com/VBA/Language-Reference-VBA/articles/vartype-function
  switch (variant.vt) {
    case kVariantTypeLongInteger:
      *out = variant.lVal;
      break;

    // We can add more variant type checks as needed
    default:
      return E_FAIL;
  }

  return result;
}

HRESULT drivelist::wmi::Query::HasPropertyString(const LPCWSTR property,
                                                 BOOL *out) {
  BSTR temp;
  const HRESULT result = GetPropertyString(property, &temp);
  if (FAILED(result))
    return result;

  if (temp == NULL) {
    *out = FALSE;
  } else {
    *out = TRUE;
  }

  // Lets free this right away. We only queried
  // this to see if it was null or not.
  SysFreeString(temp);

  return result;
}
