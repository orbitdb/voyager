export default async ({ auth, addresses }) => {
  for (const address of addresses) {
    await auth.add(address)
  }
}