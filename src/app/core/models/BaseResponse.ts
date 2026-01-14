export interface BaseResponse<T> {
  error_schema: {
    error_code: string;
    error_message: string;
  };
  output_schema: T;
}
