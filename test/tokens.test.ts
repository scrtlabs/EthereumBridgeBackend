import request from "supertest";
import app from "../src/app";
import { expect } from "chai";


describe("GET /tokens", () => {
    it("should return 200 OK", (done) => {
        request(app).get("/contact")
            .expect(200, done);
    });
});
