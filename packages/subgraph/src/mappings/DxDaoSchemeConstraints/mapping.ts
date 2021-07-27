import { Address, ByteArray, Bytes, store } from '@graphprotocol/graph-ts';

// Import entity types generated from the GraphQL schema
import { DxDaoSchemeConstraints, UpdatedContractsWhitelist } from '../../types/DxDaoSchemeConstraints/DxDaoSchemeConstraints';
import {
  GenericSchemeMultiCallParam,
} from '../../types/schema';

export function handleUpdatedContractsWhitelist(
  event: UpdatedContractsWhitelist,
): void {
  let dxDaoSchemeConstraints = DxDaoSchemeConstraints.bind(event.address);
  let genericSchemeMultiCall = dxDaoSchemeConstraints.genericSchemeMultiCall().toHex();
  let genericSchemeMultiCallParams = GenericSchemeMultiCallParam.load(genericSchemeMultiCall);
  if (genericSchemeMultiCallParams !== null) {
    let whitelistedContracts: Bytes[] = [];
    let contractsAddresses: Bytes[] = changetype<Bytes[]>(event.params._contractsAddresses);
    let contractsWhitelisted = event.params._contractsWhitelisted;
    let currentWhiteList: Bytes[] = genericSchemeMultiCallParams.contractsWhiteList as Bytes[];
    for (let i = 0; i < contractsWhitelisted.length; i++) {
      if (contractsWhitelisted[i]) {
        whitelistedContracts.push(contractsAddresses[i]);
      }
    }

    let genericSchemeMultiCallParamsContractsWhiteList = genericSchemeMultiCallParams.contractsWhiteList
    let genericSchemeMultiCallParamsContractsWhiteListLength = 0

    if (genericSchemeMultiCallParamsContractsWhiteList) {
      genericSchemeMultiCallParamsContractsWhiteListLength = genericSchemeMultiCallParamsContractsWhiteList.length
    }

    for (let i = 0; i < genericSchemeMultiCallParamsContractsWhiteListLength; i++) {
      if (contractsAddresses.indexOf(currentWhiteList[i]) === -1) {
        whitelistedContracts.push(currentWhiteList[i]);
      }
    }
    genericSchemeMultiCallParams.contractsWhiteList = whitelistedContracts as Bytes[];
    genericSchemeMultiCallParams.save();
  }
}
