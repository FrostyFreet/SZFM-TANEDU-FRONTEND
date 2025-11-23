import { describe, it, expect, vi, afterEach } from "vitest";
import axios from "axios";
import { authAPI, courseAPI } from "../API/ApiCalls";

// Mockoljuk az axios-t
vi.mock("axios");

describe("API Hívások", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("authAPI", () => {
    it("a login függvény helyes paraméterekkel hívja a POST-ot", async () => {
      const email = "test@test.hu";
      const password = "pass";
      
      await authAPI.login(email, password);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/auth/login"),
        { email, password }
      );
    });
  });

  describe("courseAPI", () => {
    it("a createCourse helyes headerrel és body-val hívódik", async () => {
      const fakeToken = "abc-123";
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(fakeToken);
      
      const courseData = {
        name: "Matek",
        day: "Hétfő",
        duration: "2 óra",
        teacherName: "tanar@test.hu",
        departmentName: "Informatika"
      };

      await courseAPI.createCourse(courseData);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/course/create"),
        {
          name: "Matek",
          day: "Hétfő",
          duration: "2 óra",
          teacher: { email: "tanar@test.hu" },
          department: { name: "Informatika" }
        },
        {
          headers: { Authorization: `Bearer ${fakeToken}` }
        }
      );
    });
  });
});