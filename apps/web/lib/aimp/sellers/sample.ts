// One definition of "this seller account id is a sample". The ids the fixtures use (`acct_demo_<state>`) and the labelled sample
// account the guided-setup runtime registers (`acct_sample_demo_<business>`). Checked on the server, never shown.
const SAMPLE_SELLER_ACCOUNT = /^acct_(sample|demo)_/;

export const isSampleSellerAccountId = (id: string | null | undefined): boolean => typeof id === 'string' && SAMPLE_SELLER_ACCOUNT.test(id);
