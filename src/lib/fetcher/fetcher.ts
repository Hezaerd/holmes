interface Service {
  name: string,
  url: string,
  existsWhen: number,
  isNSFW?: boolean,
}

export async function checkUsername(service: Service, username: string): Promise<{ service: string; exist: boolean; url: string }> {
  const url = service.url.replace("{username}", username);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000); // 5 seconds

  try {
    const response = await fetch(url, { method: "HEAD", signal: controller.signal });
    return {
      service: service.name,
      exist: response.status === service.existsWhen,
      url,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error(`Request to ${url} timed out.`);
    }
    return {
      service: service.name,
      exist: false,
      url,
    };
  } finally {
    clearTimeout(timeout);
  }
}