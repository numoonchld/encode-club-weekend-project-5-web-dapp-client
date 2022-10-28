import { BigNumber, utils } from 'ethers'

const calculatePercentageOfBigNumber = (
  amount: BigNumber,
  percentage: number,
) => {
  //  convert percentage to BigNumber
  const percentageInBigNumber = BigNumber.from(percentage)

  // multiple the amount by the percentage
  const multiplyAmountByPercentage = amount.mul(percentageInBigNumber)

  // get ether string for above big number
  const getEtherStringFromPercentageNumeratorMultipliedBigNumber = utils.formatEther(
    multiplyAmountByPercentage,
  )

  // 1ETH => 18 zeros, 1ETH/100 => 16 zeros
  const offsetDecimalsForPercentageDivision = utils.parseUnits(
    getEtherStringFromPercentageNumeratorMultipliedBigNumber,
    16,
  )

  return offsetDecimalsForPercentageDivision
}

// export default (winningAmount: ethers.BigNumber): ethers.BigNumber[] => {
export default (
  winningAmount: BigNumber,
  feePercent: number = 30,
): BigNumber[] => {
  console.log('calculate the winning amount!')

  const winningFee = calculatePercentageOfBigNumber(winningAmount, feePercent)
  console.log({ winningFee })

  const winningAfterFeeDeduction = winningAmount.sub(winningFee)
  console.log({ winningAfterFeeDeduction })

  return [winningAfterFeeDeduction, winningFee]
}
