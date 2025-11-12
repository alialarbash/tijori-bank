import instance from ".";

const getTransactions = async () => {
  const { data } = await instance.get("/mini-project/api/transactions/my");
  return data;
};

const depositBalance = async (value: number) => {
  const { data } = await instance.put(
    "/mini-project/api/transactions/deposit",
    { amount: value }
  );
  return data;
};
const withdrawBalance = async (value: number) => {
  const { data } = await instance.put(
    "/mini-project/api/transactions/withdraw",
    { amount: value }
  );
  return data;
};

const transferBalance = async (value: number, username: string) => {
  const { data } = await instance.put(
    `/mini-project/api/transactions/transfer/${username}`,
    { amount: value }
  );
  return data;
};

export { getTransactions, depositBalance, withdrawBalance, transferBalance };
