class AppError extends Error {
  statuscode: number;
  status: string;
  operational: boolean;

  constructor(message: any, statuscode: number) {
    super(message);
    this.statuscode = statuscode;
    this.status = `${statuscode}`.startsWith("4") ? "fail" : "error";
    this.operational = true;
  }
}

export default AppError;

