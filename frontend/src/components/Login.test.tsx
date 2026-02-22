import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Login } from "./Login";

// Mock the api login so we don't hit the real backend
vi.mock("../api", () => ({
  login: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

async function renderLogin() {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
}

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("renders username input and login button", async () => {
    await renderLogin();
    expect(screen.getByPlaceholderText(/enter your user name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("calls login API and navigates on submit", async () => {
    const { login } = await import("../api");
    (login as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 1,
      username: "alice",
    });

    await renderLogin();
    const input = screen.getByPlaceholderText(/enter your user name/i);
    fireEvent.change(input, { target: { value: "alice" } });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith("alice");
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/board", {
        state: { username: "alice", userId: 1 },
      });
    });
    expect(sessionStorage.getItem("userName")).toBe("alice");
    expect(sessionStorage.getItem("userId")).toBe("1");
  });
});
