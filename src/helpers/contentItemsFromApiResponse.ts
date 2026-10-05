const hasSummaryMedia = (item) => {
  const summarization = item?.summarization;
  return (summarization?.audio?.length ?? 0) > 0 || (summarization?.video?.length ?? 0) > 0;
};

const contentItemsFromApiResponse = (content, summary) => {
  const contentArray = content || [];
  if (!summary) { return contentArray; }

  return contentArray.filter(hasSummaryMedia);
};

export default contentItemsFromApiResponse;
export { hasSummaryMedia };
