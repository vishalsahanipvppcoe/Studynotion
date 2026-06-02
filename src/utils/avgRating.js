export default function GetAvgRating(ratingArr = []) {
  if (!Array.isArray(ratingArr) || ratingArr.length === 0) {
    return 0
  }

  const totalReviewCount = ratingArr.reduce((acc, curr) => {
    return acc + Number(curr?.rating || 0)
  }, 0)

  const avgReviewCount = totalReviewCount / ratingArr.length

  return Number(avgReviewCount.toFixed(1))
}