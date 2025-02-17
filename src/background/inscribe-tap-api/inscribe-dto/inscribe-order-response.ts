import { Type } from "class-transformer";
import { IsArray, IsNumber, IsString, ValidateNested } from "class-validator";

export class InscribeOrderResponse{
    @IsString()
    id: string;
    @IsNumber()
    totalFee: number;
    @IsString()
    payAddress: string;
    @IsNumber()
    status: number;
    @IsArray()
    @ValidateNested({each:true})
    @Type(()=> FileResponse)
    files: FileResponse[];
    @IsString()
    connectedAddress: string;
}
//
export class FileResponse{
    @IsString()
    filename: string;
    @IsNumber()
    size: number;
    @IsString()
    receiver: string;
    @IsNumber()
    status: number;
}