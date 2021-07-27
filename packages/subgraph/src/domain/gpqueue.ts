import { Address, BigDecimal, BigInt, ByteArray, Bytes, crypto } from '@graphprotocol/graph-ts';
import { setContinuousLocking4ReputationParams,
         setContributionRewardExtParams,
         setContributionRewardParams,
         setGenericSchemeMultiCallParams,
         setGenericSchemeParams,
         setSchemeRegistrarParams,
         setUGenericSchemeParams,
        } from '../mappings/Controller/mapping';
import {ContinuousLocking4Reputation} from '../types/ContinuousLocking4Reputation/ContinuousLocking4Reputation';
import {ContributionReward} from '../types/ContributionReward/ContributionReward';
import { ContributionRewardExt } from '../types/ContributionRewardExt/ContributionRewardExt';
import {GenericScheme} from '../types/GenericScheme/GenericScheme';
import { GenericSchemeMultiCall } from '../types/GenericSchemeMultiCall/GenericSchemeMultiCall';
import { ContractInfo, GPQueue } from '../types/schema';
import {SchemeRegistrar} from '../types/SchemeRegistrar/SchemeRegistrar';
import {UGenericScheme} from '../types/UGenericScheme/UGenericScheme';
import { concat, equalStrings, setSchemeError} from '../utils';

export function getGPQueue(id: string): GPQueue {
  let gpQueue = GPQueue.load(id) ;
  if (gpQueue == null) {
    gpQueue = new GPQueue(id);
    gpQueue.scheme = '';
  }
  return gpQueue as GPQueue;
}

export function updateThreshold(dao: string,
                                gpAddress: Address,
                                threshold: BigInt,
                                organizationId: Bytes,
                                scheme: string | null ): void {
  let gpQueue = getGPQueue(organizationId.toHex());
  gpQueue.threshold =  threshold;
  gpQueue.votingMachine = gpAddress;
  gpQueue.scheme = scheme;
  gpQueue.dao = dao;
  gpQueue.save();
}

export function create(dao: Address,
                       scheme: Address,
                       paramsHash: Bytes): void {
   let contractInfo = ContractInfo.load(scheme.toHex());
   if (contractInfo ==  null) {
     return;
   }
   let schemeId = crypto.keccak256(concat(dao, scheme)).toHex();
   let gpAddress: Address;
   let isGPQue = false;
   let addressZero = '0x0000000000000000000000000000000000000000';
   if (equalStrings(contractInfo.name, 'ContributionReward')) {
     let contributionReward =  ContributionReward.bind(scheme);
     let parameters = contributionReward.parameters(paramsHash);
     if (!equalStrings(parameters.value1.toHex(), addressZero)) {
       gpAddress = parameters.value1;
       setContributionRewardParams(dao, scheme, gpAddress, parameters.value0);
       isGPQue = true;
     } else {
      setSchemeError(schemeId, BigInt.fromI32(1), 'Scheme parameters could not be found.');
     }
   }
   if (equalStrings(contractInfo.name, 'ContributionRewardExt')) {
    let contributionRewardExt =  ContributionRewardExt.bind(scheme);
    setContributionRewardExtParams(
                    dao,
                    scheme,
                    contributionRewardExt.votingMachine(),
                    contributionRewardExt.voteParams(),
                    contributionRewardExt.rewarder());
    isGPQue = true;
   }
   if (equalStrings(contractInfo.name, 'SchemeRegistrar')) {
     let schemeRegistrar =  SchemeRegistrar.bind(scheme);
     let parameters = schemeRegistrar.parameters(paramsHash);
     if (!equalStrings(parameters.value2.toHex(), addressZero)) {
         gpAddress = parameters.value2;
         setSchemeRegistrarParams(dao, scheme, gpAddress, parameters.value0, parameters.value1);
         isGPQue = true;
     } else {
         setSchemeError(schemeId, BigInt.fromI32(1), 'Scheme parameters could not be found.');
     }
   }
   let arcVersion = BigDecimal.fromString(
      contractInfo.version.slice(contractInfo.version.length - 2, contractInfo.version.length));

   if ((equalStrings(contractInfo.name, 'UGenericScheme')) ||
       (equalStrings(contractInfo.name, 'GenericScheme') && (arcVersion < BigDecimal.fromString('24')))) {
     let genericScheme =  UGenericScheme.bind(scheme);
     let parameters = genericScheme.parameters(paramsHash);
     if (!equalStrings(parameters.value0.toHex(), addressZero)) {
         gpAddress = parameters.value0;
         setUGenericSchemeParams(dao, scheme, gpAddress, parameters.value1, parameters.value2);
         isGPQue = true;
     } else {
         setSchemeError(schemeId, BigInt.fromI32(1), 'Scheme parameters could not be found.');
     }
   } else if (equalStrings(contractInfo.name, 'GenericScheme')) {
     let genericScheme =  GenericScheme.bind(scheme);
     setGenericSchemeParams(
                     dao,
                     scheme,
                     genericScheme.votingMachine(),
                     genericScheme.voteParams(),
                     genericScheme.contractToCall());
     isGPQue = true;
   } else if (equalStrings(contractInfo.name, 'GenericSchemeMultiCall')) {
    let genericSchemeMultiCall = GenericSchemeMultiCall.bind(scheme);
    setGenericSchemeMultiCallParams(
                    dao,
                    scheme,
                    genericSchemeMultiCall.votingMachine(),
                    genericSchemeMultiCall.voteParams(),
                    genericSchemeMultiCall.schemeConstraints());
    isGPQue = true;
  } else if (equalStrings(contractInfo.name, 'ContinuousLocking4Reputation')) {
    let continuousLocking4Reputation = ContinuousLocking4Reputation.bind(scheme);
    setContinuousLocking4ReputationParams(
      dao,
      scheme,
      continuousLocking4Reputation.startTime(),
      continuousLocking4Reputation.redeemEnableTime(),
      continuousLocking4Reputation.batchTime(),
      continuousLocking4Reputation.token());
   }

   if (isGPQue) {
      let bigOne = new ByteArray(6);
      bigOne[0] = 0;
      bigOne[1] = 0;
      bigOne[2] = 0;
      bigOne[3] = 0;
      bigOne[4] = 0;
      bigOne[5] = 1;
      let organizationId = crypto.keccak256(concat(scheme, dao));
      updateThreshold(dao.toHex(),
                      gpAddress,
                      BigInt.fromUnsignedBytes(bigOne as Bytes),
                      organizationId as Bytes,
                      schemeId);
   }
}
