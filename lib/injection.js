
export const referrer = (val) => {
  Object.defineProperty(document, 'referrer', {
    value: val,
  });
};

export const userAgent = (val) => {
  Object.defineProperty(navigator, 'userAgent', {
    value: val,
  });
};

